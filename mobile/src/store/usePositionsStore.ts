import { create } from 'zustand'
import type { AgentPosition } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Store Zustand — positions des ravitailleurs en temps réel
// ─────────────────────────────────────────────────────────────────────────────

interface PositionsStore {
  agents: AgentPosition[]
  setAgents: (agents: AgentPosition[]) => void
  clear: () => void
}

export const usePositionsStore = create<PositionsStore>((set) => ({
  agents: [],

  setAgents: (agents: AgentPosition[]) => {
    set({ agents })
  },

  clear: () => {
    set({ agents: [] })
  },
}))
