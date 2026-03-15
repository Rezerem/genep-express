import React, { ReactElement, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import type { AgentPosition } from '@/types'
import { HealthIndicator, OverpassIndicator } from '@/components/HealthIndicator'
import { useAuthStore } from '@/store/useAuthStore'
import { useOrderStore } from '@/store/useOrderStore'
import { api } from '@/api/client'
import { haversine2D } from '@/lib/distance'
import { mapBottomSheetStyles } from './MapBottomSheet.styles'

interface MapBottomSheetProps {
  agents: AgentPosition[]
  userLocation: { lat: number; lng: number; alt: number } | null
}

export function MapBottomSheet({
  agents,
  userLocation,
}: MapBottomSheetProps): ReactElement {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setOrder = useOrderStore((s) => s.setOrder)

  const agentsWithDistance = agents
    .map((agent) => ({
      ...agent,
      distance: userLocation
        ? haversine2D(userLocation.lat, userLocation.lng, agent.lat, agent.lng) / 1000
        : 0,
    }))
    .sort((a, b) => a.distance - b.distance)

  const handleCommand = async () => {
    if (!selectedAgentId || !userLocation) return
    try {
      const { data } = await api.createOrder(selectedAgentId, userLocation.lat, userLocation.lng)
      setOrder(data)
      router.push(`/client/order/tracking?id=${data.id}`)
    } catch (err: unknown) {
      Alert.alert('Erreur', 'Impossible de passer la commande. L\'agent est peut-être indisponible.')
    }
  }

  const handleLogout = () => {
    void clearAuth()
    router.replace('/auth/login')
  }

  return (
    <View style={mapBottomSheetStyles.container}>
      <View style={mapBottomSheetStyles.headerContainer}>
        <Text style={mapBottomSheetStyles.header}>Ravitailleurs disponibles</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <HealthIndicator />
          <OverpassIndicator />
        </View>
      </View>
      <Text style={mapBottomSheetStyles.agentCount}>
        {agentsWithDistance.length} agent{agentsWithDistance.length !== 1 ? 's' : ''} disponible
        {agentsWithDistance.length !== 1 ? 's' : ''}
      </Text>

      <ScrollView style={mapBottomSheetStyles.listContainer}>
        {agentsWithDistance.map((agent) => (
          <TouchableOpacity
            key={agent.id}
            style={[
              mapBottomSheetStyles.agentItem,
              selectedAgentId === agent.id &&
                mapBottomSheetStyles.agentItemSelected,
            ]}
            onPress={() => setSelectedAgentId(agent.id)}
          >
            <View style={mapBottomSheetStyles.agentInfo}>
              <Text style={mapBottomSheetStyles.agentName}>{agent.name}</Text>
              <Text style={mapBottomSheetStyles.agentDistance}>
                {agent.distance.toFixed(1)} km
              </Text>
              <Text style={mapBottomSheetStyles.agentStatus}>
                {agent.available ? '● Disponible' : '● Occupé'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          mapBottomSheetStyles.commandButton,
          !selectedAgentId && mapBottomSheetStyles.commandButtonDisabled,
        ]}
        onPress={handleCommand}
        disabled={!selectedAgentId}
      >
        <Text style={mapBottomSheetStyles.commandButtonText}>Commander</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[mapBottomSheetStyles.commandButton, { backgroundColor: '#ef4444' }]}
        onPress={handleLogout}
      >
        <Text style={mapBottomSheetStyles.commandButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  )
}
