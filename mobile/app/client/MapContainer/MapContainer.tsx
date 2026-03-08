import React, { ReactElement, useMemo } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'
import { mapContainerStyles } from './MapContainer.styles'
import type { AgentPosition } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Carte OpenStreetMap via Leaflet (gratuit, pas d'API key)
// ─────────────────────────────────────────────────────────────────────────────

interface MapContainerProps {
  userLocation: { lat: number; lng: number; alt: number } | null
  pistes: any
  agents: AgentPosition[]
}

export function MapContainer({ userLocation, pistes, agents }: MapContainerProps): ReactElement {
  const htmlContent = useMemo(() => {
    if (!userLocation) return '<html></html>'

    const markers = [
      {
        lat: userLocation.lat,
        lng: userLocation.lng,
        title: 'Votre position',
        color: 'blue',
      },
      ...agents.map((agent) => ({
        lat: agent.lat,
        lng: agent.lng,
        title: agent.name,
        color: agent.available ? 'blue' : 'gray',
      })),
    ]

    const markerHTML = markers
      .map(
        (m) =>
          `L.circleMarker([${m.lat}, ${m.lng}], {radius: 8, color: '${m.color}', fillOpacity: 0.8})
          .bindPopup('${m.title}').addTo(map);`
      )
      .join('\n')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${userLocation.lat}, ${userLocation.lng}], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          ${markerHTML}
        </script>
      </body>
      </html>
    `
  }, [userLocation.lat, userLocation.lng, agents.map(a => `${a.id}${a.lat}${a.lng}${a.available}`).join(',')])


  if (!userLocation) {
    return <></>
  }

  return (
    <View style={mapContainerStyles.map}>
      <WebView
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  )
}
