import { createFileRoute, redirect } from '@tanstack/react-router'
import { handleGoogleCallbackServerFn } from '../server/auth'

export const Route = createFileRoute('/api/auth/callback/google')({
  loader: async ({ location }) => {
    const url = new URL(location.href)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error || !code) {
      throw redirect({
        to: '/',
        search: { error: 'auth_failed' },
      })
    }

    try {
      await handleGoogleCallbackServerFn({ data: { code } })

      throw redirect({
        to: '/',
      })
    } catch (err) {
      if ((err as any).isRedirect) {
        throw err
      }
      console.error('Google callback error:', err)
      throw redirect({
        to: '/',
        search: { error: 'auth_failed' },
      })
    }
  },
})
