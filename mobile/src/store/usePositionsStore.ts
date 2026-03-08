import { create } from 'zustand'
import type { AgentPosition } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Store Zustand — positions des ravitailleurs en temps réel
// Optimisé pour ne notifier que si les données changent vraiment
// ─────────────────────────────────────────────────────────────────────────────

interface PositionsStore {
  agents: AgentPosition[]
  setAgents: (agents: AgentPosition[]) => void
  updateAgentAvailability: (agentId: string, available: boolean) => void
  clear: () => void
}

// Haversine distance en mètres
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth radius en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Compare si deux agents ont vraiment changé (ignore les petits changements GPS)
function agentsEqual(a: AgentPosition, b: AgentPosition): boolean {
  // Disponibilité doit être exactement la même
  if (a.available !== b.available) return false
  // Nom doit être le même
  if (a.name !== b.name) return false
  // Position: ignore les changements < 10 mètres
  const distance = calculateDistance(a.lat, a.lng, b.lat, b.lng)
  return distance < 10 // Tolérance 10 mètres
}

// Compare si deux arrays d'agents sont identiques
function agentArrayEqual(a: AgentPosition[], b: AgentPosition[]): boolean {
  if (a.length !== b.length) return false
  const bMap = new Map(b.map((agent) => [agent.id, agent]))
  return a.every((agent) => {
    const bAgent = bMap.get(agent.id)
    return bAgent && agentsEqual(agent, bAgent)
  })
}

export const usePositionsStore = create<PositionsStore>((set, get) => ({
  agents: [],

  setAgents: (newAgents: AgentPosition[]) => {
    set((state) => {
      // Ne mettre à jour que si les données ont vraiment changé
      if (agentArrayEqual(state.agents, newAgents)) {
        return state // Pas de changement significatif, ne pas notifier
      }
      return { agents: newAgents }
    })
  },

  updateAgentAvailability: (agentId: string, available: boolean) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId && agent.available !== available
          ? { ...agent, available }
          : agent
      ),
    }))
  },

  clear: () => {
    set({ agents: [] })
  },
}))
