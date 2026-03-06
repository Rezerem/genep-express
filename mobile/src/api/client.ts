import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Injecte le JWT dans chaque requête s'il est présent
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Expose les routes de l'API sous forme de fonctions typées
export const api = {
  getHealth: () =>
    apiClient.get<{ status: string; db: string; redis: string; uptime: number }>('/health'),
}
