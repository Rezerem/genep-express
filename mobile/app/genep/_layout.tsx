/**
 * GENEP LAYOUT
 * ───────────────────────────────────────────────────────
 * Layout pour les écrans du ravitailleur (GENEP)
 * - Navigation entre home, orders, settings
 * - Groupé sous /genep/*
 */

import { Stack } from 'expo-router'
import { ReactElement } from 'react'
export default function GenepLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
