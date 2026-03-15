import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/useAuthStore'
import { registerSocketHandlers } from '../services/socketHandlers'

// ─────────────────────────────────────────────────────────────────────────────
// Hook Socket.io — gère la connexion WS et le cycle de vie
// ─────────────────────────────────────────────────────────────────────────────

let socketInstance: Socket | null = null

export function useSocket(): { socket: Socket | null } {
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
      return
    }

    if (!socketInstance) {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

      socketInstance = io(apiUrl, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      registerSocketHandlers(socketInstance)

      socketInstance.on('connect_error', (error: Error) => {
        console.warn('Socket connection error:', error.message)
      })
    }

    return () => {
      if (socketInstance && !token) {
        socketInstance.disconnect()
        socketInstance = null
      }
    }
  }, [token])

  return { socket: socketInstance }
}
