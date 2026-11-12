import 'server-only'

export function baseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (envUrl && !envUrl.includes('localhost')) return envUrl.replace(/\/$/, '')
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

/** Accetta solo percorsi interni: evita redirect aperti. */
export function safeNext(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function withQuery(path: string, params: Record<string, string | undefined>): string {
  const url = new URL(path, 'https://example.invalid')
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }
  return `${url.pathname}${url.search}`
}