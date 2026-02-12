export function generateId(): string {
  return crypto.randomUUID()
}

export function getCookieFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const cookie = cookies.find((c) => c.startsWith(`${name}=`))
  return cookie ? cookie.split('=')[1] : null
}
