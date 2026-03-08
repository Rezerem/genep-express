import { useEffect, useState } from 'react'
import { api } from '@/api/client'

export type HealthStatus = 'loading' | 'ok' | 'degraded' | 'unreachable'

export function useHealthCheck() {
  const [status, setStatus] = useState<HealthStatus>('loading')

  useEffect(() => {
    console.log('[HealthCheck] Starting health checks')
    console.log('[HealthCheck] API Base URL:', require('@/api/client').apiClient.defaults.baseURL)

    // Initial check
    const checkHealth = async () => {
      try {
        console.log('[HealthCheck] Calling /health')
        const res = await api.getHealth()
        const newStatus = res.data.status === 'ok' ? 'ok' : 'degraded'
        console.log('[HealthCheck] Response:', res.data.status, '→', newStatus)
        setStatus(newStatus)
      } catch (error: any) {
        console.error('[HealthCheck] Error details:')
        console.error('  - Message:', error?.message)
        console.error('  - Code:', error?.code)
        console.error('  - Status:', error?.response?.status)
        console.error('  - Response:', error?.response?.data)
        console.error('  - Full error:', error)
        setStatus('unreachable')
      }
    }

    checkHealth()

    // Poll every 5 seconds
    const interval = setInterval(checkHealth, 5000)

    return () => {
      console.log('[HealthCheck] Clearing interval')
      clearInterval(interval)
    }
  }, [])

  return status
}
