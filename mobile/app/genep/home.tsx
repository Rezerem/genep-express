import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Switch, ActivityIndicator, Modal } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'
import { useSocket } from '@/hooks/useSocket'
import { useOrderStore } from '@/store/useOrderStore'
import { useGpsTracking } from '@/hooks/useGpsTracking'
import { useOrderManagement } from '@/hooks/useOrderManagement'
import { api } from '@/api/client'
import { homeStyles as s } from './home.styles'

export default function GenepHomeScreen() {
  const { user, clearAuth } = useAuthStore()
  const { socket } = useSocket()
  const incomingOrder = useOrderStore((st) => st.incomingOrder)
  const genepActiveOrder = useOrderStore((st) => st.genepActiveOrder)

  const [available, setAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  const { locationStatus, startTracking, stopTracking } = useGpsTracking()
  const { handlingOrder, handleAcceptOrder, handleRefuseOrder, handleOnRoute, handleDelivered } =
    useOrderManagement()

  // Initialiser le profil au montage
  useEffect(() => {
    const initProfile = async () => {
      try {
        setLoading(true)
        const displayName = user?.email?.split('@')[0] || 'Ravitailleur'
        await api.createGenepProfile(displayName)
      } catch (err) {
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
      } catch (err) {
        console.error('Availability update error:', err)
        setAvailable(!available)
      }
    }

    updateAvailability()
  }, [available])

  // Gérer le suivi GPS
  useEffect(() => {
    const manageTracking = async () => {
      if (available) {
        const success = await startTracking(socket)
        if (!success) setAvailable(false)
      } else {
        stopTracking()
      }
    }

    manageTracking()
  }, [available, socket])

  const handleLogout = async () => {
    stopTracking()
    await clearAuth()
    router.replace('/')
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={s.loadingText}>Initialisation du profil...</Text>
      </View>
    )
  }

  return (
    <>
      {/* Modal commande entrante */}
      <Modal visible={incomingOrder !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Nouvelle commande !</Text>
            {incomingOrder && (
              <View style={s.modalMeetBox}>
                <Text style={s.modalMeetLabel}>Point de rendez-vous</Text>
                <Text style={s.modalMeetCoord}>Lat: {incomingOrder.meetLat.toFixed(4)}</Text>
                <Text style={s.modalMeetCoord}>Lng: {incomingOrder.meetLng.toFixed(4)}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleAcceptOrder}
              disabled={handlingOrder}
              style={s.btnAccept}
            >
              <Text style={s.btnModalText}>{handlingOrder ? 'Traitement...' : 'Accepter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefuseOrder}
              disabled={handlingOrder}
              style={s.btnRefuse}
            >
              <Text style={s.btnModalText}>{handlingOrder ? 'Traitement...' : 'Refuser'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Écran principal */}
      <View style={s.screen}>
        <Text style={s.title}>Service Ravitailleur</Text>
        <Text style={s.subtitle}>{user?.email}</Text>

        {/* Toggle disponibilité */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>En service</Text>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
            />
          </View>
        </View>

        {/* Statut GPS */}
        <View style={s.gpsCard}>
          <Text style={s.gpsLabel}>Statut GPS</Text>
          <Text style={available ? s.gpsStatusActive : s.gpsStatusInactive}>{locationStatus}</Text>
        </View>

        {/* Livraison en cours */}
        {genepActiveOrder && (
          <View style={s.activeOrderCard}>
            <Text style={s.activeOrderTitle}>Livraison en cours</Text>
            <View style={s.meetPointBox}>
              <Text style={s.meetPointLabel}>Point de rendez-vous</Text>
              <Text style={s.meetPointCoord}>Lat: {genepActiveOrder.meetLat.toFixed(4)}</Text>
              <Text style={s.meetPointCoord}>Lng: {genepActiveOrder.meetLng.toFixed(4)}</Text>
              <Text style={s.meetPointStatus}>
                Statut:{' '}
                <Text style={s.meetPointStatusValue}>{genepActiveOrder.status}</Text>
              </Text>
            </View>

            {genepActiveOrder.status === 'accepted' && (
              <TouchableOpacity
                onPress={handleOnRoute}
                disabled={handlingOrder}
                style={s.btnBlue}
              >
                <Text style={s.btnTextMd}>{handlingOrder ? 'Mise à jour...' : 'Je suis en route'}</Text>
              </TouchableOpacity>
            )}

            {genepActiveOrder.status === 'en_route' && (
              <TouchableOpacity
                onPress={handleDelivered}
                disabled={handlingOrder}
                style={s.btnGreen}
              >
                <Text style={s.btnTextMd}>{handlingOrder ? 'Mise à jour...' : 'Livraison effectuée'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Mode client */}
        <TouchableOpacity onPress={() => router.replace('/client/map')} style={s.btnClientMode}>
          <Text style={s.btnTextLg}>Passer en Mode Client</Text>
        </TouchableOpacity>

        {/* Déconnexion */}
        <TouchableOpacity onPress={handleLogout} style={s.btnLogout}>
          <Text style={s.btnTextLg}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
