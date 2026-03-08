import React, { ReactElement, useEffect } from 'react'
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

export function HealthIndicator(): ReactElement {
  const status = useHealthCheck()

  useEffect(() => {
    console.log('[HealthIndicator] Rendered, status:', status)
  }, [status])

  const color = statusColors[status]
  const label = statusLabels[status]

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
