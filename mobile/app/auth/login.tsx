import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'
import { apiClient } from '@/api/client'

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export default function LoginScreen() {
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  // For development: Call backend /auth/dev endpoint to get a real JWT
  // In production, replace with proper Google OAuth
  const handleTestLogin = async () => {
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Call development endpoint on backend
      // Don't specify role - will use existing role from DB or default to CLIENT
      const response = await apiClient.post<{ token: string; user: { id: string; email: string; role: string } }>('/auth/dev', {
        email: email.trim(),
      })

      const { token, user } = response.data

      // Store in SecureStore
      await setAuth(token, { id: user.id, email: user.email, role: user.role as 'CLIENT' | 'GENEP' | 'ADMIN' })

      // Redirect to home
      router.replace('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 40,
          textAlign: 'center',
          color: '#333',
        }}
      >
        Genep'express
      </Text>

      <Text
        style={{
          fontSize: 12,
          color: '#9ca3af',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        Dev Mode: Connecte-toi pour voir la carte
      </Text>

      {error && (
        <Text
          style={{
            color: '#d32f2f',
            marginBottom: 20,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: '600',
          }}
        >
          {error}
        </Text>
      )}

      <TextInput
        placeholder="your.email@example.com"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        style={{
          width: '100%',
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 16,
          fontSize: 16,
          color: '#1f2937',
          backgroundColor: '#fff',
        }}
      />

      <TouchableOpacity
        disabled={loading || !email.trim()}
        onPress={handleTestLogin}
        style={{
          backgroundColor: loading || !email.trim() ? '#d1d5db' : '#10b981',
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 8,
          width: '100%',
          alignItems: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
            Se connecter
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
