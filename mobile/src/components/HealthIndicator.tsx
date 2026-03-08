import React, { ReactElement } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useHealthCheck, type HealthStatus } from '@/hooks/useHealthCheck'

const statusColors: Record<HealthStatus, string> = {
  loading: '#f59e0b',
  ok: '#10b981',
  degraded: '#f97316',
  unreachable: '#ef4444',
}

const statusLabels: Record<HealthStatus, string> = {
  loading: 'Init...',
  ok: 'API OK',
  degraded: 'Dégradé',
  unreachable: 'API Down',
}

const serviceColors: Record<string, string> = {
  ok: '#10b981',
  error: '#ef4444',
  unknown: '#9ca3af',
}

export function HealthIndicator(): ReactElement {
  const details = useHealthCheck()

  const color = statusColors[details.status]
  const label = statusLabels[details.status]

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

export function OverpassIndicator(): ReactElement {
  const details = useHealthCheck()

  const color = serviceColors[details.overpass]
  const label = details.overpass === 'ok' ? 'Map' : 'Map ⚠'

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1f1f1f',
    borderRadius: 6,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    color: '#e0e0e0',
    fontWeight: '500',
  },
})
