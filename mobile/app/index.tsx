import { HealthScreen } from '@/screens/HealthScreen'

// Point d'entrée temporaire — affiche le health check (gate B-00)
// Sera remplacé par la navigation conditionnelle en B-01 (auth Google)
export default function Index(): JSX.Element {
  return <HealthScreen />
}
