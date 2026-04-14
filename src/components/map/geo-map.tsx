"use client"

import { useEffect, useRef } from "react"

export type GeoMapFeature = {
  id: string
  /** GeoJSON geometry object (Polygon, MultiPolygon, …) */
  geometry: Record<string, unknown>
  color?: string
  fillColor?: string
  fillOpacity?: number
  weight?: number
  /** HTML shown in popup on click */
  popup?: string
}

type GeoMapProps = {
  features: GeoMapFeature[]
  /** Map container height in pixels (default 400) */
  height?: number
  className?: string
  /** Use satellite imagery tiles (ESRI World Imagery) */
  satellite?: boolean
}

export function GeoMap({ features, height = 400, className, satellite }: GeoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return // already mounted

    let cancelled = false

    // Leaflet only runs in the browser
    const initMap = async () => {
      const L = (await import("leaflet")).default
      if (cancelled) return
      // Guard against StrictMode double-invocation: container may already have a Leaflet instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((containerRef.current as any)?._leaflet_id) return

      // Fix broken default icon URLs in webpack / Next.js builds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current!, {
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // Tile layer — satellite (ESRI World Imagery) or street (OSM)
      const tileUrl = satellite
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      const tileAttr = satellite
        ? 'Tiles &copy; <a href="https://www.esri.com" target="_blank">Esri</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 19,
      }).addTo(map)

      // Layer group to compute bounds across all features
      const boundsGroup = L.featureGroup()

      for (const feature of features) {
        try {
          const layer = L.geoJSON(
            // Leaflet accepts a GeoJSON geometry object directly
            { type: "Feature", geometry: feature.geometry, properties: {} } as unknown as GeoJSON.Feature,
            {
              style: {
                color: feature.color ?? "#3b82f6",
                fillColor: feature.fillColor ?? feature.color ?? "#3b82f6",
                fillOpacity: feature.fillOpacity ?? 0.2,
                weight: feature.weight ?? 2,
              },
            }
          )

          if (feature.popup) {
            layer.bindPopup(feature.popup)
          }

          layer.addTo(map)
          boundsGroup.addLayer(layer)
        } catch {
          // Skip invalid/unsupported geometries silently
        }
      }

      if (boundsGroup.getLayers().length > 0) {
        map.fitBounds(boundsGroup.getBounds(), { padding: [24, 24] })
      } else {
        // Fallback: Spain centre
        map.setView([40.4168, -3.7038], 6)
      }

      if (!cancelled) mapRef.current = map
    }

    initMap()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // features are serialised from the server — they won't change after mount

  return (
    <>
      {/* Leaflet CSS — loaded here so it only applies when the map renders */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        style={{ height }}
        className={className ?? "w-full rounded-md border overflow-hidden"}
      />
    </>
  )
}
