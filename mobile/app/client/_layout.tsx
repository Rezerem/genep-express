import { Stack } from 'expo-router'
import {ReactElement} from "react";

/**
 * Layout pour les écrans client/skieur
 * Utilise Stack pour la navigation
 */
export default function ClientLayout(): ReactElement {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
