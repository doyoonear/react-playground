import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import type { CloudflareEnv } from './env'
import type { MandalartData } from '../stores/mandalart'
import { generateId, getCookieFromRequest } from './utils'

async function getUserIdFromSession(env: CloudflareEnv, request: Request): Promise<string | null> {
  const sessionId = getCookieFromRequest(request, 'session_id')
  if (!sessionId) return null

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

  return session.user_id
}

export const getMandalart = createServerFn({ method: 'GET' })
  .inputValidator((data?: { year?: string }) => data)
  .handler(async ({ context, data }) => {
    const env = (context as any).cloudflare.env as CloudflareEnv
    const request = getRequest()
    const userId = await getUserIdFromSession(env, request)
    if (!userId) {
      throw new Error('Unauthorized')
    }

    let query = 'SELECT id, year, title, keyword, commitment, cells FROM mandalart WHERE user_id = ?'
    const params: string[] = [userId]

    if (data?.year) {
      query += ' AND year = ?'
      params.push(data.year)
    }

    query += ' ORDER BY created_at DESC'

    const results = await env.DB.prepare(query)
      .bind(...params)
      .all<{
        id: string
        year: string
        title: string
        keyword: string
        commitment: string
        cells: string
      }>()

    return results.results.map((row) => ({
      id: row.id,
      year: row.year,
      title: row.title,
      keyword: row.keyword,
      commitment: row.commitment,
      cells: JSON.parse(row.cells),
    }))
  })

export const saveMandalart = createServerFn({ method: 'POST' })
  .inputValidator((data: MandalartData & { id?: string }) => data)
  .handler(async ({ context, data }) => {
    const env = (context as any).cloudflare.env as CloudflareEnv
    const request = getRequest()
    const userId = await getUserIdFromSession(env, request)
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const existing = data.id
      ? await env.DB.prepare('SELECT id FROM mandalart WHERE id = ? AND user_id = ?')
          .bind(data.id, userId)
          .first<{ id: string }>()
      : await env.DB.prepare('SELECT id FROM mandalart WHERE user_id = ? AND year = ?')
          .bind(userId, data.year)
          .first<{ id: string }>()

    const cellsJson = JSON.stringify(data.cells)

    if (existing) {
      await env.DB.prepare(
        'UPDATE mandalart SET year = ?, title = ?, keyword = ?, commitment = ?, cells = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?'
      )
        .bind(data.year, data.title, data.keyword, data.commitment, cellsJson, existing.id, userId)
        .run()

      return { id: existing.id }
    } else {
      const id = data.id || generateId()
      await env.DB.prepare(
        'INSERT INTO mandalart (id, user_id, year, title, keyword, commitment, cells) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
        .bind(id, userId, data.year, data.title, data.keyword, data.commitment, cellsJson)
        .run()

      return { id }
    }
  })

export const deleteMandalart = createServerFn({ method: 'POST' })
  .inputValidator((data: string) => data)
  .handler(async ({ context, data }) => {
    const env = (context as any).cloudflare.env as CloudflareEnv
    const request = getRequest()
    const userId = await getUserIdFromSession(env, request)
    if (!userId) {
      throw new Error('Unauthorized')
    }

    await env.DB.prepare('DELETE FROM mandalart WHERE id = ? AND user_id = ?')
      .bind(data, userId)
      .run()

    return { success: true }
  })
