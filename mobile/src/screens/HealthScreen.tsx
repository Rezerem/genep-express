import {ReactElement, useEffect, useState} from 'react'
import { ActivityIndicator, StyleSheet, Text, View, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '@/api/client'

type Status = 'loading' | 'ok' | 'degraded' | 'unreachable'

interface HealthData {
  db: string
  redis: string
  uptime: number
}

export function HealthScreen(): ReactElement {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<HealthData | null>(null)

  useEffect(() => {
    void checkHealth()
  }, [])

  async function checkHealth(): Promise<void> {
    try {
      const res = await api.getHealth()
      setData({ db: res.data.db, redis: res.data.redis, uptime: res.data.uptime })
      setStatus(res.data.status === 'ok' ? 'ok' : 'degraded')
    } catch {
      setStatus('unreachable')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Genep'express</Text>
      <Text style={styles.subtitle}>B-00 — Health Check</Text>

      {status === 'loading' && <ActivityIndicator size="large" color="#3dd68c" />}

      {status !== 'loading' && (
        <>
          <View style={styles.card}>
            <Row label="API" value={status !== 'unreachable' ? 'ok' : 'unreachable'} />
            {data && (
              <>
                <Row label="PostgreSQL" value={data.db} />
                <Row label="Redis" value={data.redis} />
                <Row label="Uptime" value={`${data.uptime}s`} neutral />
              </>
            )}
          </View>
          {status === 'ok' && (
            <Pressable
              style={styles.button}
              onPress={() => router.push('/client/map')}
            >
              <Text style={styles.buttonText}>Go to Map</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  )
}

interface RowProps {
  label: string
  value: string
  neutral?: boolean
}

function Row({ label, value, neutral = false }: RowProps): ReactElement {
  const isOk = value === 'ok'
  const color = neutral ? '#888' : isOk ? '#3dd68c' : '#f87171'

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e8e8e8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  rowLabel: {
    color: '#888',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  rowValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#3dd68c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})
