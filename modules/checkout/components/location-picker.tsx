"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet"
import { DEFAULT_MAP_CENTER, roundCoordinate, type MapLocation } from "@/modules/orders"

const DEFAULT_ZOOM = 13
/** Zoom used when the map opens on an already marked point. */
const PINNED_ZOOM = 16
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/**
 * Inline SVG pin. Leaflet's stock marker loads PNGs through URLs that bundlers rewrite and break,
 * so the icon is drawn here and needs no image assets.
 */
const PIN_ICON = L.divIcon({
  className: "",
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40" aria-hidden="true"><path d="M14 0C6.3 0 0 6.2 0 13.9 0 24.3 14 40 14 40s14-15.7 14-26.1C28 6.2 21.7 0 14 0z" fill="#000"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>`,
})

type LocationPickerProps = {
  /** The marked point, or `null` while nothing is marked. */
  value: MapLocation | null
  onChange: (next: MapLocation | null) => void
  /** Ids of the elements that describe the map (help text, error). */
  describedBy?: string
}

const toLocation = (point: L.LatLng): MapLocation => {
  // A pin dragged around the antimeridian can report a longitude outside -180..180.
  const { lat, lng } = point.wrap()
  return { lat: roundCoordinate(lat), lng: roundCoordinate(lng) }
}

function ClickToMark({ onChange }: { onChange: (next: MapLocation) => void }) {
  useMapEvents({ click: (event) => onChange(toLocation(event.latlng)) })
  return null
}

/** OpenStreetMap map where the shopper clicks to place a draggable pin. Client-only (Leaflet needs `window`). */
export function LocationPicker({ value, onChange, describedBy }: LocationPickerProps) {
  const center = value ?? DEFAULT_MAP_CENTER

  return (
    <div
      role="group"
      aria-label="Mapa para marcar la ubicación de entrega"
      aria-describedby={describedBy}
      className="isolate h-72 w-full overflow-hidden border border-neutral-300 sm:h-96"
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={value ? PINNED_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
        <ClickToMark onChange={onChange} />
        {value ? (
          <Marker
            position={[value.lat, value.lng]}
            icon={PIN_ICON}
            draggable
            keyboard={false}
            eventHandlers={{
              dragend: (event) => onChange(toLocation((event.target as L.Marker).getLatLng())),
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  )
}
