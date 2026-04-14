"use client"

import dynamic from "next/dynamic"
import type { GeoMapFeature } from "./geo-map"

const GeoMapDynamic = dynamic(
  () => import("./geo-map").then((m) => m.GeoMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-md border bg-muted animate-pulse" style={{ height: 380 }} />
    ),
  }
)

type Props = {
  features: GeoMapFeature[]
  height?: number
  satellite?: boolean
}

/**
 * Client-side wrapper that lazy-loads Leaflet.
 * Import this in Server Components instead of GeoMap directly.
 */
export function GeoMapLoader({ features, height, satellite }: Props) {
  if (features.length === 0) return null
  return <GeoMapDynamic features={features} height={height} satellite={satellite} />
}
