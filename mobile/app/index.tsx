import { Redirect } from 'expo-router'

// Redirige directement vers la carte (B-04)
// TODO: Remplacer par la navigation conditionnelle en B-01 (auth Google)
export default function Index() {
  return <Redirect href="/client/map" />
}
