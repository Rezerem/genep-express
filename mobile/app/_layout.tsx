import {ReactElement, useEffect} from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '@/store/useAuthStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

console.log('[_layout] Module loading')

export default function RootLayout(): ReactElement{
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)

  // Recharge le token au démarrage — avant le premier rendu des routes
  useEffect(() => {
    console.log('[RootLayout] Mounting')
    void loadFromStorage()
  }, [loadFromStorage])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  )
}
