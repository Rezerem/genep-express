import { useState } from 'react'
import { api } from '@/api/client'
import { useOrderStore } from '@/store/useOrderStore'

interface OrderManagementResult {
  handlingOrder: boolean
  handleAcceptOrder: () => Promise<void>
  handleRefuseOrder: () => Promise<void>
  handleOnRoute: () => Promise<void>
  handleDelivered: () => Promise<void>
}

export function useOrderManagement(): OrderManagementResult {
  const [handlingOrder, setHandlingOrder] = useState(false)
  const incomingOrder = useOrderStore((s) => s.incomingOrder)
  const setIncomingOrder = useOrderStore((s) => s.setIncomingOrder)
  const genepActiveOrder = useOrderStore((s) => s.genepActiveOrder)
  const setGenepActiveOrder = useOrderStore((s) => s.setGenepActiveOrder)
  const clearGenepActiveOrder = useOrderStore((s) => s.clearGenepActiveOrder)

  const handleAcceptOrder = async () => {
    if (!incomingOrder) return
    try {
      setHandlingOrder(true)
      await api.updateOrderStatus(incomingOrder.id, 'accepted')
      setGenepActiveOrder({ ...incomingOrder, status: 'accepted' })
      setIncomingOrder(null)
    } catch (err) {
      console.error('Failed to accept order:', err)
    } finally {
      setHandlingOrder(false)
    }
  }

  const handleRefuseOrder = async () => {
    if (!incomingOrder) return
    try {
      setHandlingOrder(true)
      await api.updateOrderStatus(incomingOrder.id, 'cancelled')
      setIncomingOrder(null)
    } catch (err) {
      console.error('Failed to refuse order:', err)
    } finally {
      setHandlingOrder(false)
    }
  }

  const handleOnRoute = async () => {
    if (!genepActiveOrder) return
    try {
      setHandlingOrder(true)
      await api.updateOrderStatus(genepActiveOrder.id, 'en_route')
      setGenepActiveOrder({ ...genepActiveOrder, status: 'en_route' })
    } catch (err) {
      console.error('Failed to update order status:', err)
    } finally {
      setHandlingOrder(false)
    }
  }

  const handleDelivered = async () => {
    if (!genepActiveOrder) return
    try {
      setHandlingOrder(true)
      await api.updateOrderStatus(genepActiveOrder.id, 'delivered')
      clearGenepActiveOrder()
    } catch (err) {
      console.error('Failed to mark order as delivered:', err)
    } finally {
      setHandlingOrder(false)
    }
  }

  return { handlingOrder, handleAcceptOrder, handleRefuseOrder, handleOnRoute, handleDelivered }
}
