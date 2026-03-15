import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import type { User, Order, OrderStatus } from '@/types'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' }
})

// Injecte le JWT dans chaque requête s'il est présent
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Types pour les réponses API
export interface AuthGoogleResponse {
  token: string
  user: User
}

export interface GenepProfileResponse {
  id: string
  name: string
  available: boolean
}

// Expose les routes de l'API sous forme de fonctions typées
export const api = {
  getHealth: () =>
    apiClient.get<{ status: string; db: string; redis: string; overpass: string; uptime: number }>('/health'),

  authGoogle: (idToken: string) =>
    apiClient.post<AuthGoogleResponse>('/auth/google', { idToken }),

  getPistes: (south: number, west: number, north: number, east: number) =>
    apiClient.get('/map/pistes', {
      params: { south, west, north, east },
    }),

  getAgents: () =>
    apiClient.get('/map/agents'),

  createGenepProfile: (name: string) =>
    apiClient.post<GenepProfileResponse>('/genep/profile', { name }),

  updateAvailability: (available: boolean) =>
    apiClient.patch('/genep/available', { available }),

  createOrder: (genepId: string, meetLat: number, meetLng: number) =>
    apiClient.post<Order>('/orders', { genepId, meetLat, meetLng }),

  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    apiClient.patch<Order>(`/orders/${orderId}/status`, { status }),

  getOrder: (orderId: string) =>
    apiClient.get<Order>(`/orders/${orderId}`),
}
