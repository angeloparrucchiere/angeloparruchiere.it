import { redirect } from 'next/navigation'
import { clearAuthCookies } from '@/lib/auth-cookies'

export async function POST(request: Request) {
  const response = redirect('/')
  clearAuthCookies(response, request)
  return response
}