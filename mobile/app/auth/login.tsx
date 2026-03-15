import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'
import { apiClient } from '@/api/client'
import { loginStyles as s } from './login.styles'

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

      const response = await apiClient.post<{ token: string; user: { id: string; email: string; role: string } }>('/auth/dev', {
        email: email.trim(),
      })

      const { token, user } = response.data

      await setAuth(token, { id: user.id, email: user.email, role: user.role as 'CLIENT' | 'GENEP' | 'ADMIN' })

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
    <View style={s.container}>
      <Text style={s.title}>Genep'express</Text>

      <Text style={s.devLabel}>Dev Mode: Connecte-toi pour voir la carte</Text>

      {error && <Text style={s.error}>{error}</Text>}

      <TextInput
        placeholder="your.email@example.com"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        style={s.input}
      />

      <TouchableOpacity
        disabled={loading || !email.trim()}
        onPress={handleTestLogin}
        style={loading || !email.trim() ? s.btnDisabled : s.btnEnabled}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>Se connecter</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
