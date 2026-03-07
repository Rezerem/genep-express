import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '@/store/useAuthStore'

export default function RootLayout(): JSX.Element {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)

  // Recharge le token au démarrage — avant le premier rendu des routes
  useEffect(() => {
    void loadFromStorage()
  }, [loadFromStorage])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
