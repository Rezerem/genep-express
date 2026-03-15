import React, { ReactElement } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { OrderTrackingScreen } from './OrderTrackingScreen'

/**
 * Page de suivi de commande avec paramètre dynamique
 * Accès : /client/order/tracking?id=<orderId>
 */
export default function OrderTrackingPage(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <OrderTrackingScreen orderId={id ?? ''} />
}
