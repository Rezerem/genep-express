import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/useAuthStore'
import { usePositionsStore } from '../store/usePositionsStore'
import type { AgentPosition } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Hook Socket.io — gère la connexion WS et les positions temps réel
// ─────────────────────────────────────────────────────────────────────────────

let socketInstance: Socket | null = null

export function useSocket(): void {
  const token = useAuthStore((state) => state.token)
  const setAgents = usePositionsStore((state) => state.setAgents)

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      return
    }

    // Initialize socket connection
    if (!socketInstance) {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

      socketInstance = io(apiUrl, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      // Listen for position updates
      socketInstance.on('positions:update', (data: { agents: AgentPosition[] }) => {
        setAgents(data.agents)
      })

      // Handle connection errors
      socketInstance.on('connect_error', (error: Error) => {
        console.warn('Socket connection error:', error.message)
      })
    }

    // Cleanup on unmount
    return () => {
      if (socketInstance && !token) {
        socketInstance.disconnect()
        socketInstance = null
      }
    }
  }, [token, setAgents])
}
