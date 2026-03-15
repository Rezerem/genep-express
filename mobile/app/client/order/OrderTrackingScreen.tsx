import React, { ReactElement, useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useOrderStore } from '@/store/useOrderStore'
import { api } from '@/api/client'
import type { Order } from '@/types'
import { orderTrackingStyles as styles, statusColors, statusLabels } from './OrderTrackingScreen.styles'

interface OrderTrackingScreenProps {
  orderId: string
}

export function OrderTrackingScreen({ orderId }: OrderTrackingScreenProps): ReactElement {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const activeOrder = useOrderStore((s) => s.activeOrder)
  const setOrder = useOrderStore((s) => s.setOrder)
  const initialStatusRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        if (activeOrder?.id === orderId) {
          if (initialStatusRef.current === undefined) {
            initialStatusRef.current = activeOrder.status
          }
          setLoading(false)
          return
        }
        const { data } = await api.getOrder(orderId)
        setOrder(data)
        if (initialStatusRef.current === undefined) {
          initialStatusRef.current = data.status
        }
      } catch (err) {
        console.error('Failed to load order:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, activeOrder?.id, setOrder])

  useEffect(() => {
    if (activeOrder?.status === 'en_route' && initialStatusRef.current !== 'en_route') {
      router.replace('/client/map')
    }
  }, [activeOrder?.status, router])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!activeOrder || activeOrder.id !== orderId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.header}>Commande non trouvée</Text>
      </View>
    )
  }

  const order = activeOrder
  const statusColor = statusColors[order.status] || '#666'
  const statusLabel = statusLabels[order.status] || order.status

  const timeline = [
    { status: 'pending', label: 'Commande créée' },
    { status: 'accepted', label: 'Acceptée par le ravitailleur' },
    { status: 'en_route', label: 'En route' },
    { status: 'delivered', label: 'Livrée' },
  ]

  const getStatusIndex = () => {
    const index = timeline.findIndex((item) => item.status === order.status)
    return index === -1 ? 0 : index
  }

  const currentStatusIndex = getStatusIndex()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Suivi de commande</Text>

      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusBadgeText}>{statusLabel}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut</Text>
        <View style={styles.timelineContainer}>
          {timeline.map((item, index) => (
            <View key={item.status} style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor:
                      index <= currentStatusIndex ? statusColors[item.status] : '#d1d5db',
                  },
                ]}
              />
              <Text
                style={[
                  styles.timelineText,
                  { color: index <= currentStatusIndex ? '#333' : '#999' },
                ]}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Point de rendez-vous</Text>
        <Text style={styles.coordinatesText}>Lat: {order.meetLat.toFixed(4)}</Text>
        <Text style={styles.coordinatesText}>Lng: {order.meetLng.toFixed(4)}</Text>
      </View>

      {(order.status === 'delivered' || order.status === 'cancelled') && (
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/client/map')}>
          <Text style={styles.buttonText}>Retour à la carte</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}
