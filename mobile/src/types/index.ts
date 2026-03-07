// ─────────────────────────────────────────────────────────────────────────────
// Types partagés — miroir des modèles Prisma côté backend
// ─────────────────────────────────────────────────────────────────────────────

export type Role = 'CLIENT' | 'GENEP' | 'ADMIN'

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'en_route'
  | 'delivered'
  | 'cancelled'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  role: Role
}

export interface AgentPosition {
  id: string
  name: string
  lat: number
  lng: number
  altitude: number
  available: boolean
}

export interface Order {
  id: string
  status: OrderStatus
  meetLat: number
  meetLng: number
  genepId: string
  clientId: string
  createdAt: string
  updatedAt: string
}

// Réponse de POST /auth/google
export interface AuthResponse {
  token: string
  user: User
}
