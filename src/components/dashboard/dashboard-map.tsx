"use client"

import { useEffect, useRef } from "react"

export type ProjectMarker = {
  id: string
  name: string
  lat: number
  lng: number
  powerMW?: number | null
  developer?: string | null
  status: string
  technologies: Array<{ type: string; powerMW?: number }>
}

const STATUS_LABELS: Record<string, string> = {
  OPPORTUNITY: "Oportunidad",
  IN_DEVELOPMENT: "En Desarrollo",
  RTB: "Ready to Build",
  IN_CONSTRUCTION: "En Construcción",
  IN_OPERATION: "En Operación",
}

type Props = {
  markers: ProjectMarker[]
  height?: number
}

export function DashboardMap({ markers, height = 550 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    let cancelled = false

    const initMap = async () => {
      const L = (await import("leaflet")).default

      // Fix broken default icon URLs in webpack/Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1/dist/images/marker-shadow.png",
      })

      if (cancelled) return

      const map = L.map(containerRef.current!, {
        zoomControl: true,
        scrollWheelZoom: true,
      })

      // --- Base layers ---
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      })

      const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://opentopomap.org">OpenTopoMap</a> · © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 17,
      })

      const satellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: '© <a href="https://www.esri.com">Esri</a>',
          maxZoom: 19,
        },
      )

      // --- Overlay: Catastro parcels (WMS) ---
      const catastro = L.tileLayer.wms(
        "https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx",
        {
          layers: "Catastro",
          format: "image/png",
          transparent: true,
          attribution: '© <a href="https://www.sedecatastro.gob.es">Catastro</a>',
        },
      )

      // Start with topo as default
      topo.addTo(map)

      L.control
        .layers(
          { Topográfico: topo, Estándar: osm, Satélite: satellite },
          { Parcelas: catastro },
          { position: "topright" },
        )
        .addTo(map)

      // Default view: España
      map.setView([40.4168, -3.7038], 6)

      const boundsGroup = L.featureGroup()

      for (const m of markers) {
        const techLabel = m.technologies.map((t) => t.type).join(", ") || "—"
        const popupHtml = `
          <div style="min-width:180px;font-family:sans-serif;font-size:13px">
            <strong style="font-size:14px">${m.name}</strong><br/>
            <span style="color:#6b7280">${STATUS_LABELS[m.status] ?? m.status}</span><br/>
            <span>${techLabel}</span><br/>
            ${m.powerMW != null ? `<span>${m.powerMW} MW</span><br/>` : ""}
            ${m.developer ? `<span style="color:#6b7280">${m.developer}</span>` : ""}
          </div>
        `

        const marker = L.circleMarker([m.lat, m.lng], {
          radius: 9,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.85,
          weight: 2,
        }).bindPopup(popupHtml)

        marker.addTo(map)
        boundsGroup.addLayer(marker)
      }

      if (boundsGroup.getLayers().length > 0) {
        map.fitBounds(boundsGroup.getBounds(), { padding: [48, 48], maxZoom: 10 })
      }

      mapRef.current = map
    }

    initMap()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when the filtered list changes without remounting the map
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default

      // Remove existing circle markers
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
          map.removeLayer(layer)
        }
      })

      for (const m of markers) {
        const techLabel = m.technologies.map((t) => t.type).join(", ") || "—"
        const popupHtml = `
          <div style="min-width:180px;font-family:sans-serif;font-size:13px">
            <strong style="font-size:14px">${m.name}</strong><br/>
            <span style="color:#6b7280">${STATUS_LABELS[m.status] ?? m.status}</span><br/>
            <span>${techLabel}</span><br/>
            ${m.powerMW != null ? `<span>${m.powerMW} MW</span><br/>` : ""}
            ${m.developer ? `<span style="color:#6b7280">${m.developer}</span>` : ""}
          </div>
        `

        L.circleMarker([m.lat, m.lng], {
          radius: 9,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.85,
          weight: 2,
        })
          .bindPopup(popupHtml)
          .addTo(map)
      }
    }

    updateMarkers()
  }, [markers])

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        style={{ height }}
        className="w-full rounded-md border overflow-hidden"
      />
    </>
  )
}
