'use client'

import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapArea = {
  lat: number
  lon: number
  count: number
  city?: string
  regionName?: string
  country?: string
}

/** Creates a div icon showing the affected count as a badge on the map */
function createCountIcon(count: number) {
  const size = 36
  const fontSize = count > 99 ? 10 : count > 9 ? 12 : 14
  return L.divIcon({
    className: 'affected-count-marker',
    html: `<span class="affected-count-badge" style="font-size:${fontSize}px">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function FitBounds({ areas }: { areas: MapArea[] }) {
  const map = useMap()
  useEffect(() => {
    if (areas.length === 0) return
    if (areas.length === 1) {
      map.setView([areas[0].lat, areas[0].lon], 12)
      return
    }
    const bounds = L.latLngBounds(areas.map((a) => [a.lat, a.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
  }, [map, areas])
  return null
}

const BANGLADESH_CENTER: [number, number] = [23.685, 90.356]
const DEFAULT_ZOOM = 7

export default function AffectedAreasMap({ areas }: { areas: MapArea[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const markers = useMemo(() => {
    return areas.map((area, i) => ({
      ...area,
      key: `${area.lat}-${area.lon}-${i}`,
      icon: createCountIcon(area.count),
    }))
  }, [areas])

  if (!mounted) {
    return (
      <div className="map-placeholder">
        <span>Loading map…</span>
      </div>
    )
  }

  return (
    <div className="map-wrapper">
      <MapContainer
        center={BANGLADESH_CENTER}
        zoom={DEFAULT_ZOOM}
        className="affected-areas-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {areas.length > 0 && <FitBounds areas={areas} />}
        {markers.map(({ key, lat, lon, icon, count, city, regionName, country }) => (
          <Marker key={key} position={[lat, lon]} icon={icon}>
            <Popup>
              <div className="map-popup">
                <strong>{count} report{count !== 1 ? 's' : ''}</strong>
                {city && <div>{city}</div>}
                {regionName && <div>{regionName}</div>}
                {country && <div>{country}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
