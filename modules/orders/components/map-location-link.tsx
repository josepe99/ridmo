import { buildMapLocationUrl, hasMapLocation } from "../domain/map-location"
import { cn } from "@/shared/lib/utils"

type Props = {
  latitude: number | null | undefined
  longitude: number | null | undefined
  className?: string
}

/** "Ver ubicación en el mapa": opens the point an order was marked at on OpenStreetMap. Nothing without a point. */
export function MapLocationLink({ latitude, longitude, className }: Props) {
  if (!hasMapLocation({ latitude, longitude })) return null

  return (
    <a
      href={buildMapLocationUrl(latitude as number, longitude as number)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("underline underline-offset-4", className)}
    >
      Ver ubicación en el mapa
    </a>
  )
}
