/**
 * Delivery location marked on a map (instead of a written address).
 *
 * Pure and client-safe. Coordinates are plain WGS84 decimal degrees.
 */

export type MapLocation = { lat: number; lng: number }

/** Street stored in orders whose address was marked on a map: there is no written street. */
export const MAP_LOCATION_STREET = "Ubicación marcada en el mapa"

/** Where the map opens when nothing is marked yet: Asunción. */
export const DEFAULT_MAP_CENTER: MapLocation = { lat: -25.2637, lng: -57.5759 }

/** Decimal places kept for a point (about 0.1 m); also keeps the number out of exponent notation. */
const COORDINATE_DECIMALS = 6

export const roundCoordinate = (value: number): number => Number(value.toFixed(COORDINATE_DECIMALS))

/** Whether an order's stored coordinates are both present and usable. */
export function hasMapLocation(coordinates: {
  latitude?: number | null
  longitude?: number | null
}): coordinates is { latitude: number; longitude: number } {
  return Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
}

/** OpenStreetMap link that opens the map with a marker on the point. */
export function buildMapLocationUrl(lat: number, lng: number): string {
  const latitude = roundCoordinate(lat)
  const longitude = roundCoordinate(lng)
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`
}
