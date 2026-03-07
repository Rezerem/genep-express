import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { User } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean

  setAuth: (token: string, user: User) => Promise<void>
  clearAuth: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token)
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user))
    set({ token, user })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token')
    await SecureStore.deleteItemAsync('auth_user')
    set({ token: null, user: null })
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token')
      const raw = await SecureStore.getItemAsync('auth_user')
      const user = raw ? (JSON.parse(raw) as User) : null
      set({ token, user })
    } catch {
      // Stockage corrompu — on repart de zéro
      set({ token: null, user: null })
    } finally {
      set({ isLoading: false })
    }
  },
}))
