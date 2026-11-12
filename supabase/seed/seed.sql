-- Dati di test della Fase 1. Nessun cliente reale.
-- Gli account staff/admin si creano con scripts/crea-utenti-test.mjs (auth.users
-- non si puo popolare da SQL), poi si collegano a public.staff con
-- scripts/collega-staff.mjs.

insert into public.services (name, description, category, price_cents, duration_minutes, sort_order) values
  ('Taglio uomo', 'Taglio con lavaggio e styling finale.', 'taglio', 2500, 30, 10),
  ('Taglio bambino', 'Taglio per bambini fino a 10 anni.', 'taglio', 1800, 30, 20),
  ('Taglio e barba', 'Taglio completo e rifinitura della barba.', 'taglio', 3800, 60, 30),
  ('Barba modellata', 'Rifinitura a forbice o macchinetta con rasatura del contorno.', 'barba', 2000, 30, 40),
  ('Colore radice', 'Ritocco della ricrescita con colore professionale.', 'colore', 4500, 90, 50),
  ('Balayage', 'Schiariture luminose su tutta la lunghezza.', 'colore', 7500, 150, 60),
  ('Piega', 'Piega con asciugatura e finitura.', 'trattamento', 2000, 30, 70),
  ('Trattamento ristrutturante', 'Maschera ristrutturante con massaggio alla cute.', 'trattamento', 2500, 45, 80);

insert into public.staff (display_name, title, bio, sort_order) values
  ('Dario', 'Parrucchiere e titolare', 'Uomo: taglio, barba e rigenerazione. Colori naturali e ricerca di nuovo stile.', 10),
  ('Giulia', 'Parrucchiera senior', 'Donna: taglio, piega e colori luminosi.', 20);

insert into public.staff_services (staff_id, service_id)
select s.id, sv.id
from public.staff s
cross join public.services sv
where s.display_name = 'Dario'
  and sv.name in ('Taglio uomo', 'Taglio bambino', 'Taglio e barba', 'Barba modellata');

insert into public.staff_services (staff_id, service_id)
select s.id, sv.id
from public.staff s
cross join public.services sv
where s.display_name = 'Giulia'
  and sv.name in ('Taglio uomo', 'Taglio e barba', 'Colore radice', 'Balayage', 'Piega', 'Trattamento ristrutturante');

-- Chiusi la domenica (0). Si apre 9-13 e 14-19: la pausa pranzo non e un
-- appuntamento, quindi si registrano due fasce.
insert into public.availability (staff_id, weekday, start_time, end_time)
select s.id, d.weekday, t.start_time, t.end_time
from public.staff s
cross join generate_series(1, 6) as d (weekday)
cross join (values ('09:00'::time, '13:00'::time), ('14:00'::time, '19:00'::time)) as t (start_time, end_time)
where s.display_name in ('Dario', 'Giulia');