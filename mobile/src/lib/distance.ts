// ─────────────────────────────────────────────────────────────────────────────
// Calcul de distance Haversine 3D (avec dénivelé)
// ─────────────────────────────────────────────────────────────────────────────

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Haversine 2D — distance à plat entre deux points GPS
 */
function haversine2D(
  startLatitude: number,
  startLongitude: number,
  endLatitude: number,
  endLongitude: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const startLatRad = toRadians(startLatitude)
  const endLatRad = toRadians(endLatitude)
  const deltaLatRad = toRadians(endLatitude - startLatitude)
  const deltaLngRad = toRadians(endLongitude - startLongitude)

  const sinDeltaLatHalf = Math.sin(deltaLatRad / 2)
  const sinDeltaLngHalf = Math.sin(deltaLngRad / 2)

  const a =
    sinDeltaLatHalf * sinDeltaLatHalf +
    Math.cos(startLatRad) *
      Math.cos(endLatRad) *
      sinDeltaLngHalf *
      sinDeltaLngHalf

  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * centralAngle
}

/**
 * Distance Haversine 3D = √(distance2D² + altitudeDifference²)
 * Retourne la distance réelle en montagne avec dénivelé considéré
 */
export function haversine3D(
  startLatitude: number,
  startLongitude: number,
  startAltitude: number,
  endLatitude: number,
  endLongitude: number,
  endAltitude: number
): { distance: number; altitudeDifference: number } {
  const distance2D = haversine2D(
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude
  )
  const altitudeDifference = Math.abs(startAltitude - endAltitude)
  const distance3D = Math.sqrt(
    distance2D * distance2D + altitudeDifference * altitudeDifference
  )

  return { distance: distance3D, altitudeDifference }
}

/**
 * Formate une distance avec dénivelé pour l'affichage
 * Exemple : "215m (−80m déniv.)"
 */
export function formatDistance(distanceMeters: number, altitudeDifferenceMeters: number): string {
  const roundedDistance = Math.round(distanceMeters)
  const roundedAltitude = Math.round(altitudeDifferenceMeters)

  if (roundedAltitude === 0) {
    return `${roundedDistance}m`
  }

  return `${roundedDistance}m (−${roundedAltitude}m déniv.)`
}
