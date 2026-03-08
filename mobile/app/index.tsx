import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '@/store/useAuthStore'

export default function Index() {
  const { token, user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!token) {
    return <Redirect href="/auth/login" />
  }

  if (user?.role === 'GENEP') {
    return <Redirect href="/genep/home" />
  }

  return <Redirect href="/client/map" />
}
