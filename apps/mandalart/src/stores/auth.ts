import { create } from 'zustand'
import { getCurrentUser, getGoogleAuthURL, logout as logoutServerFn } from '../server/auth'

interface User {
  id: string
  googleId: string
  email: string
  name: string | null
  picture: string | null
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  checkAuth: () => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const user = await getCurrentUser()
      set({ user, isLoading: false })
    } catch (error) {
      console.error('Failed to check auth:', error)
      set({ user: null, isLoading: false })
    }
  },

  login: async () => {
    try {
      const authUrl = await getGoogleAuthURL()
      window.location.href = authUrl
    } catch (error) {
      console.error('Failed to get auth URL:', error)
    }
  },

  logout: async () => {
    try {
      await logoutServerFn()
      set({ user: null })
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  },
}))
