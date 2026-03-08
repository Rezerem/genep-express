import React, { ReactElement } from 'react'
import { View, Text } from 'react-native'
import { haversine3D, formatDistance } from '@/lib/distance'
import { agentMarkerStyles } from './AgentMarker.styles'
import type { AgentPosition } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Composant marqueur d'agent sur la carte
// ─────────────────────────────────────────────────────────────────────────────

interface AgentMarkerProps {
  agent: AgentPosition
  userLat: number | null
  userLng: number | null
  userAlt: number | null
}

export function AgentMarker({
  agent,
  userLat,
  userLng,
  userAlt,
}: AgentMarkerProps): ReactElement {
  let displayDistance = 'N/A'

  if (userLat !== null && userLng !== null && userAlt !== null) {
    const result = haversine3D(userLat, userLng, userAlt, agent.lat, agent.lng, agent.altitude)
    displayDistance = formatDistance(result.distance, result.altitudeDifference)
  }

  return (
    <View style={agentMarkerStyles.container}>
      <View
        style={[
          agentMarkerStyles.dot,
          { backgroundColor: agent.available ? '#3b82f6' : '#a0a0a0' },
        ]}
      />
      <Text style={agentMarkerStyles.label}>{agent.name}</Text>
      <Text style={agentMarkerStyles.distance}>{displayDistance}</Text>
    </View>
  )
}
