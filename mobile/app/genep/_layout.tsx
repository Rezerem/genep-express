import { Stack } from 'expo-router'
import { ReactElement } from 'react'

/**
 * Layout pour les écrans ravitailleur (GENEP)
 * Utilise Stack pour la navigation
 */
export default function GenepLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
