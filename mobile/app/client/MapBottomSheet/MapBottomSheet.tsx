import React, { ReactElement, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import type { AgentPosition } from '@/types'
import { HealthIndicator, OverpassIndicator } from '@/components/HealthIndicator'
import { useAuthStore } from '@/store/useAuthStore'
import { mapBottomSheetStyles } from './MapBottomSheet.styles'

interface MapBottomSheetProps {
  agents: AgentPosition[]
  userLocation: { lat: number; lng: number; alt: number } | null
}

// Haversine distance calculation (same as backend)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth radius in km
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

export function MapBottomSheet({
  agents,
  userLocation,
}: MapBottomSheetProps): ReactElement {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const agentsWithDistance = agents
    .map((agent) => ({
      ...agent,
      distance: userLocation
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            agent.lat,
            agent.lng
          )
        : 0,
    }))
    .sort((a, b) => a.distance - b.distance)

  const handleCommand = () => {
    if (selectedAgentId) {
      // TODO: Implement command creation logic
      console.log(`Commanding agent: ${selectedAgentId}`)
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
