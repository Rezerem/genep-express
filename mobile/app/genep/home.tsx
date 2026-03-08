import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Switch, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'
import { useSocket } from '@/hooks/useSocket'
import { api } from '@/api/client'

export default function GenepHomeScreen() {
  const { user, clearAuth } = useAuthStore()
  const { socket } = useSocket()

  const [available, setAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState<string>('Localisation non initiée')
  const [locationWatcher, setLocationWatcher] = useState<Location.LocationSubscription | null>(null)

  // Initialiser le profil au montage
  useEffect(() => {
    const initProfile = async () => {
      try {
        setLoading(true)
        const displayName = user?.email?.split('@')[0] || 'Ravitailleur'
        await api.createGenepProfile(displayName)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create profile'
        setLocationStatus(`Erreur profil: ${message}`)
        console.error('Profile creation error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      initProfile()
    }
  }, [user?.id])

  // Gérer le changement de disponibilité
  useEffect(() => {
    const updateAvailability = async () => {
      try {
        await api.updateAvailability(available)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update availability'
        setLocationStatus(`Erreur: ${message}`)
        console.error('Availability update error:', err)
        setAvailable(!available)
      }
    }

    updateAvailability()
  }, [available])

  // Gérer le suivi GPS séparement pour éviter les boucles infinies
  useEffect(() => {
    const manageTacking = async () => {
      if (available) {
        await startLocationTracking()
      } else {
        if (locationWatcher) {
          locationWatcher.remove()
          setLocationWatcher(null)
        }
        setLocationStatus('Service désactivé')
      }
    }

    manageTacking()
  }, [available])

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setLocationStatus('Permission de localisation refusée')
        setAvailable(false)
        return
      }

      try {
        // Commencer à suivre la position avec precision haute
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Mettre à jour toutes les 5 secondes (match broadcast)
            distanceInterval: 0, // Peu importe la distance (timeInterval prime)
          },
          (location) => {
            const { latitude: lat, longitude: lng, altitude } = location.coords
            setLocationStatus(`Position: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`)

            // Émettre la position via socket
            if (socket?.connected) {
              socket.emit('agent:position', {
                lat,
                lng,
                altitude: altitude || 0,
              })
            }
          }
        )

        setLocationWatcher(watcher)
      } catch (watchErr: unknown) {
        // Si watchPositionAsync échoue (expo-keep-awake issue), utiliser getCurrentPositionAsync en polling
        console.warn('watchPositionAsync failed, falling back to polling:', watchErr)
        setLocationStatus('Mode de localisation dégradé (polling)')

        const pollInterval = setInterval(async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            })
            const { latitude: lat, longitude: lng, altitude } = location.coords
            setLocationStatus(`Position: ${lat.toFixed(4)}°, ${lng.toFixed(4)}° (polling)`)

            if (socket?.connected) {
              socket.emit('agent:position', {
                lat,
                lng,
                altitude: altitude || 0,
              })
            }
          } catch (err: unknown) {
            console.error('Polling error:', err)
          }
        }, 5000) // Poll toutes les 5 secondes (match broadcast)

        // Store interval pour pouvoir l'arrêter plus tard
        setLocationWatcher({
          remove: () => clearInterval(pollInterval),
        } as any)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Location tracking error'
      setLocationStatus(`Erreur GPS: ${message}`)
      console.error('Location tracking error:', err)
      setAvailable(false)
    }
  }

  const handleLogout = async () => {
    if (locationWatcher) {
      locationWatcher.remove()
    }
    await clearAuth()
    router.replace('/')
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#666' }}>Initialisation du profil...</Text>
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 40,
        backgroundColor: '#f9fafb',
      }}
    >
      {/* En-tête */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
        Service Ravitailleur
      </Text>
      <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
        {user?.email}
      </Text>

      {/* Toggle disponibilité */}
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1f2937' }}>
            En service
          </Text>
          <Switch
            value={available}
            onValueChange={setAvailable}
            trackColor={{ false: '#d1d5db', true: '#10b981' }}
          />
        </View>
      </View>

      {/* Statut GPS */}
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>
          Statut GPS
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: available ? '#059669' : '#6b7280',
            fontFamily: 'monospace',
          }}
        >
          {locationStatus}
        </Text>
      </View>

      {/* Bouton mode client */}
      <TouchableOpacity
        onPress={() => router.replace('/client/map')}
        style={{
          backgroundColor: '#3b82f6',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
          Passer en Mode Client
        </Text>
      </TouchableOpacity>

      {/* Bouton déconnexion */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: '#ef4444',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
          Déconnexion
        </Text>
      </TouchableOpacity>
    </View>
  )
}
