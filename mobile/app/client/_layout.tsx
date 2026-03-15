/**
 * CLIENT LAYOUT
 * ───────────────────────────────────────────────────────
 * Layout pour les écrans du client/skieur
 * - Navigation entre map, order tracking
 * - Groupé sous /client/*
 */

import { Stack } from 'expo-router'
import { ReactElement } from 'react'
export default function ClientLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
