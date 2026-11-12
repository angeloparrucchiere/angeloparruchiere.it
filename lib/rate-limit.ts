import 'server-only'
import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/**
 * Limite semplice in memoria: sufficiente per una singola istanza.
 * In produzione (Fase 2) si passa a un limite condiviso su Supabase.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfter: 0 }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') ?? 'sconosciuto'
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { ok: false, error: 'Troppe richieste. Riprova tra qualche minuto.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}