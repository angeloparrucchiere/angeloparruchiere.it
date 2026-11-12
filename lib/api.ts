import { NextResponse } from 'next/server'
import type { z } from 'zod'
import { firstError } from '@/lib/validation/schemas'

export type ApiOk<T> = { ok: true; data: T }
export type ApiError = { ok: false; error: string; fields?: Record<string, string> }

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, { status })
}

export function fail(error: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json<ApiError>({ ok: false, error, fields }, { status })
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/** Valida il body e restituisce i dati o una risposta 422 gia pronta. */
export function parseBody<S extends z.ZodType>(
  schema: S,
  body: unknown,
): { success: true; data: z.output<S> } | { success: false; response: NextResponse<ApiError> } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json<ApiError>(
        { ok: false, error: firstError(result.error), fields: fieldErrorsOf(result.error) },
        { status: 422 },
      ),
    }
  }
  return { success: true, data: result.data }
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}