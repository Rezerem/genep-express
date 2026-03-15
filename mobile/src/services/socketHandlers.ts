import type { Socket } from 'socket.io-client'
import { usePositionsStore } from '@/store/usePositionsStore'
import { useOrderStore } from '@/store/useOrderStore'
import type { AgentPosition, OrderStatus } from '@/types'

export function registerSocketHandlers(socket: Socket): void {
  socket.on('positions:update', (data: { agents: AgentPosition[] }) => {
    const { setAgents } = usePositionsStore.getState()
    setAgents(data.agents)
  })

  socket.on('genep:availability', (data: { id: string; name: string; available: boolean }) => {
    const { updateAgentAvailability } = usePositionsStore.getState()
    updateAgentAvailability(data.id, data.available)
  })

  socket.on('order:new', (data: { orderId: string; clientId: string; meetLat: number; meetLng: number; createdAt: string }) => {
    const { setIncomingOrder } = useOrderStore.getState()
    setIncomingOrder({
      id: data.orderId,
      status: 'pending',
      meetLat: data.meetLat,
      meetLng: data.meetLng,
      genepId: '',
      clientId: data.clientId,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    })
  })

  socket.on('order:status', (data: { orderId: string; status: OrderStatus }) => {
    const { activeOrder, setOrder } = useOrderStore.getState()
    if (activeOrder?.id === data.orderId) {
      setOrder({ ...activeOrder, status: data.status })
    }
  })
}
