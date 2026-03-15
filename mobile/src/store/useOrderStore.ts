import { create } from 'zustand'
import type { Order } from '@/types'

interface OrderState {
  activeOrder: Order | null       // côté CLIENT — suivi de sa commande
  incomingOrder: Order | null     // côté GENEP — commande entrante à accepter
  genepActiveOrder: Order | null  // côté GENEP — commande acceptée en cours de livraison
  setOrder: (order: Order) => void
  clearOrder: () => void
  setIncomingOrder: (order: Order | null) => void
  setGenepActiveOrder: (order: Order) => void
  clearGenepActiveOrder: () => void
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrder: null,
  incomingOrder: null,
  genepActiveOrder: null,

  setOrder: (order) => set({ activeOrder: order }),

  clearOrder: () => set({ activeOrder: null }),

  setIncomingOrder: (order) => set({ incomingOrder: order }),

  setGenepActiveOrder: (order) => set({ genepActiveOrder: order }),

  clearGenepActiveOrder: () => set({ genepActiveOrder: null }),
}))
