import { create } from 'zustand'
import type { AgentPosition } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Store Zustand — positions des ravitailleurs en temps réel
// ─────────────────────────────────────────────────────────────────────────────

interface PositionsStore {
  agents: AgentPosition[]
  setAgents: (agents: AgentPosition[]) => void
  updateAgentAvailability: (agentId: string, available: boolean) => void
  clear: () => void
}

export const usePositionsStore = create<PositionsStore>((set) => ({
  agents: [],

  setAgents: (agents: AgentPosition[]) => {
    set({ agents })
  },

  updateAgentAvailability: (agentId: string, available: boolean) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, available } : agent
      ),
    }))
  },

  clear: () => {
    set({ agents: [] })
  },
}))
