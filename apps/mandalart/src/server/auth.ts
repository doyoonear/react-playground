import { createServerFn } from '@tanstack/react-start'
import { getRequest, setCookie } from '@tanstack/react-start/server'
import type { CloudflareEnv } from './env'
import { generateId, getCookieFromRequest } from './utils'

interface User {
  id: string
  googleId: string
  email: string
  name: string | null
  picture: string | null
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
}

async function getSessionUser(env: CloudflareEnv, sessionId: string): Promise<User | null> {
  const session = await env.DB.prepare(
    'SELECT user_id, expires_at FROM sessions WHERE id = ?'
  )
    .bind(sessionId)
    .first<{ user_id: string; expires_at: string }>()

  if (!session) return null

  if (new Date(session.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
    return null
  }

  const user = await env.DB.prepare(
    'SELECT id, google_id, email, name, picture FROM users WHERE id = ?'
  )
    .bind(session.user_id)
    .first<{
      id: string
      google_id: string
      email: string
      name: string | null
      picture: string | null
    }>()

  if (!user) return null

  return {
    id: user.id,
    googleId: user.google_id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  }
}

export const getGoogleAuthURL = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const env = (context as any).cloudflare.env as CloudflareEnv
  const request = getRequest()

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/callback/google`

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
})

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async ({ context }) => {
  const request = getRequest()
  const sessionId = getCookieFromRequest(request, 'session_id')
  if (!sessionId) return null

  const env = (context as any).cloudflare.env as CloudflareEnv
  return await getSessionUser(env, sessionId)
})

export const logout = createServerFn({ method: 'POST' }).handler(async ({ context }) => {
  const request = getRequest()
  const sessionId = getCookieFromRequest(request, 'session_id')
  if (!sessionId) {
    return { success: true }
  }

  const env = (context as any).cloudflare.env as CloudflareEnv
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()

  return { success: true }
})

export const handleGoogleCallbackServerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ context, data }) => {
    const env = (context as any).cloudflare.env as CloudflareEnv
    const request = getRequest()

    const result = await processGoogleCallback(env, request, data.code)

    setCookie('session_id', result.sessionId, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return { success: true }
  })

async function processGoogleCallback(
  env: CloudflareEnv,
  request: Request,
  code: string
): Promise<{ user: User; sessionId: string; cookie: string }> {
  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/callback/google`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for token')
  }

  const tokens = (await tokenResponse.json()) as { access_token: string }

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  })

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch user info')
  }

  const googleUser = (await userInfoResponse.json()) as GoogleUserInfo

  let user = await env.DB.prepare('SELECT id, google_id, email, name, picture FROM users WHERE google_id = ?')
    .bind(googleUser.id)
    .first<{
      id: string
      google_id: string
      email: string
      name: string | null
      picture: string | null
    }>()

  if (!user) {
    const userId = generateId()
    await env.DB.prepare(
      'INSERT INTO users (id, google_id, email, name, picture) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(userId, googleUser.id, googleUser.email, googleUser.name, googleUser.picture)
      .run()

    user = {
      id: userId,
      google_id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    }
  } else {
    await env.DB.prepare('UPDATE users SET email = ?, name = ?, picture = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(googleUser.email, googleUser.name, googleUser.picture, user.id)
      .run()

    user = {
      ...user,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    }
  }

  const sessionId = generateId()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, user.id, expiresAt)
    .run()

  const cookie = `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`

  return {
    user: {
      id: user.id,
      googleId: user.google_id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
    sessionId,
    cookie,
  }
}
