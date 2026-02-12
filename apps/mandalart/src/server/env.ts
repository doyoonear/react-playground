export interface CloudflareEnv {
  DB: D1Database
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  SESSION_SECRET: string
}

export function validateEnv(env: CloudflareEnv): CloudflareEnv {
  if (!env.DB) {
    throw new Error('D1 database not found. Make sure DB binding is configured in wrangler.jsonc')
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not found. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .dev.vars')
  }

  if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET not found. Set SESSION_SECRET in .dev.vars')
  }

  return env
}
