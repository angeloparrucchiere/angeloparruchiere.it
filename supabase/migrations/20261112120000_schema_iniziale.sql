-- Salone angeloparruchiere.it - schema iniziale (Fase 1)
--
-- Tabelle: profiles, services, staff, staff_services, availability, appointments,
-- contacts, email_queue, launch_signups.
-- Accesso ai dati solo tramite le API di Next.js con la service key: il Data API
-- resta chiuso tramite RLS + revoke dei permessi.

create extension if not exists "btree_gist";

create type public.user_role as enum ('cliente', 'staff', 'admin');
create type public.appointment_status as enum ('richiesto', 'confermato', 'completato', 'annullato', 'rifiutato');
create type public.email_status as enum ('in_coda', 'inviata', 'fallita');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'cliente',
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Dati del cliente collegati all''utente autenticato (auth.users).';

create index profiles_role_idx on public.profiles (role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Profilo creato in automatico alla registrazione. Il nome viene preso dai
-- metadati inviati da Next.js (signUp con options.data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, marketing_consent, marketing_consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false) then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  category text not null default 'taglio',
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes between 15 and 480),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- staff
-- ---------------------------------------------------------------------------

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  display_name text not null,
  title text not null default 'Parrucchiere',
  bio text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.staff_services (
  staff_id uuid not null references public.staff (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  primary key (staff_id, service_id)
);

-- ---------------------------------------------------------------------------
-- availability (fasce settimanali: 0 = domenica, 6 = sabato)
-- ---------------------------------------------------------------------------

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (start_time < end_time)
);

create index availability_staff_weekday_idx on public.availability (staff_id, weekday);

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  staff_id uuid not null references public.staff (id),
  service_id uuid not null references public.services (id),
  status public.appointment_status not null default 'richiesto',
  -- orari sempre in UTC; il sito li mostra nel fuso Europe/Rome
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  service_name text not null,
  service_price_cents integer not null,
  notes text not null default '',
  staff_note text not null default '',
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint appointments_no_overlap
    exclude using gist (staff_id with =, tstzrange(starts_at, ends_at) with &&)
    where (status in ('richiesto', 'confermato'))
);

create index appointments_customer_idx on public.appointments (customer_id, starts_at desc);
create index appointments_staff_starts_idx on public.appointments (staff_id, starts_at);
create index appointments_status_starts_idx on public.appointments (status, starts_at);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contacts (modulo contatti del sito)
-- ---------------------------------------------------------------------------

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  consent_privacy boolean not null default true,
  status text not null default 'nuovo' check (status in ('nuovo', 'letto', 'archiviato')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- launch_signups (form "avvisami all'apertura")
-- ---------------------------------------------------------------------------

create table public.launch_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- email_queue (invii Resend + log, con retry automatico dal keepalive)
-- ---------------------------------------------------------------------------

create table public.email_queue (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  html text not null,
  text text not null default '',
  reply_to text,
  kind text not null,
  appointment_id uuid references public.appointments (id) on delete cascade,
  status public.email_status not null default 'in_coda',
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  scheduled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index email_queue_pending_idx on public.email_queue (scheduled_at) where status = 'in_coda';

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_services enable row level security;
alter table public.availability enable row level security;
alter table public.appointments enable row level security;
alter table public.contacts enable row level security;
alter table public.launch_signups enable row level security;
alter table public.email_queue enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_staff_read" on public.profiles
  for select to authenticated using (public.is_staff() and role = 'cliente');

create policy "appointments_select_own" on public.appointments
  for select to authenticated using ((select auth.uid()) = customer_id);
create policy "appointments_staff_read" on public.appointments
  for select to authenticated using (public.is_staff());
create policy "appointments_staff_update" on public.appointments
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "services_authenticated_read" on public.services
  for select to authenticated using (is_active);
create policy "services_admin_write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff_authenticated_read" on public.staff
  for select to authenticated using (is_active);
create policy "staff_admin_write" on public.staff
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff_services_authenticated_read" on public.staff_services
  for select to authenticated using (true);
create policy "staff_services_admin_write" on public.staff_services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "availability_authenticated_read" on public.availability
  for select to authenticated using (true);
create policy "availability_staff_write" on public.availability
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "contacts_admin_read" on public.contacts
  for select to authenticated using (public.is_admin());
create policy "launch_signups_admin_read" on public.launch_signups
  for select to authenticated using (public.is_admin());
create policy "email_queue_admin_read" on public.email_queue
  for select to authenticated using (public.is_admin());

-- Il Data API (Supabase REST) resta chiuso: l'app parla col database solo
-- dalle route di Next.js con la service key. Nessuna policy = nessun accesso
-- via anon key, anche se RLS venisse temporaneamente disattivata.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;