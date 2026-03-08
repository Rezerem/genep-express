import { useEffect, useState } from 'react'
import { api } from '@/api/client'

export type HealthStatus = 'loading' | 'ok' | 'degraded' | 'unreachable'
export type ServiceStatus = 'ok' | 'error' | 'unknown'

export interface HealthCheckDetails {
  status: HealthStatus
  db: ServiceStatus
  redis: ServiceStatus
  overpass: ServiceStatus
}

export function useHealthCheck() {
  const [details, setDetails] = useState<HealthCheckDetails>({
    status: 'loading',
    db: 'unknown',
    redis: 'unknown',
    overpass: 'unknown',
  })

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth()
        setDetails({
          status: res.data.status === 'ok' ? 'ok' : 'degraded',
          db: res.data.db as ServiceStatus,
          redis: res.data.redis as ServiceStatus,
          overpass: res.data.overpass as ServiceStatus,
        })
      } catch {
        setDetails({
          status: 'unreachable',
          db: 'unknown',
          redis: 'unknown',
          overpass: 'unknown',
        })
      }
    }

    checkHealth()

    // Poll every 5 seconds
    const interval = setInterval(checkHealth, 5000)

    return () => clearInterval(interval)
  }, [])

  return details
}
