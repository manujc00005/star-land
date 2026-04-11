"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { FolderKanban, Filter, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ProjectMarker } from "./dashboard-map"

// Lazy-load Leaflet map (client-only)
const DashboardMapDynamic = dynamic(
  () => import("./dashboard-map").then((m) => m.DashboardMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-md border bg-muted animate-pulse"
        style={{ height: 550 }}
      />
    ),
  }
)

export type ProjectSummary = {
  id: string
  name: string
  powerMW?: number | null
  developer?: string | null
  status: string
  technologies: Array<{ type: string; powerMW?: number }>
  hasGeometry: boolean
}

type Props = {
  firstName: string
  orgName: string
  projects: ProjectSummary[]
  allMarkers: ProjectMarker[]
}

export function DashboardClient({ firstName, orgName, projects, allMarkers }: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTech, setFilterTech] = useState("")
  const [filterPowerMin, setFilterPowerMin] = useState("")
  const [filterDeveloper, setFilterDeveloper] = useState("")
  const [filterName, setFilterName] = useState("")

  // Unique technology types across all projects for the select options
  const techOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of projects) {
      for (const t of p.technologies) {
        if (t.type) set.add(t.type)
      }
    }
    return Array.from(set).sort()
  }, [projects])

  const hasActiveFilters =
    filterTech !== "" || filterPowerMin !== "" || filterDeveloper !== "" || filterName !== ""

  // Apply filters
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false
      if (filterTech && !p.technologies.some((t) => t.type === filterTech)) return false
      if (filterDeveloper && !(p.developer ?? "").toLowerCase().includes(filterDeveloper.toLowerCase())) return false
      if (filterPowerMin) {
        const min = parseFloat(filterPowerMin)
        if (!isNaN(min) && (p.powerMW == null || p.powerMW < min)) return false
      }
      return true
    })
  }, [projects, filterName, filterTech, filterDeveloper, filterPowerMin])

  // Only show map markers for filtered projects that have geometry
  const filteredMarkerIds = new Set(filteredProjects.map((p) => p.id))
  const visibleMarkers = allMarkers.filter((m) => filteredMarkerIds.has(m.id))

  const clearFilters = () => {
    setFilterTech("")
    setFilterPowerMin("")
    setFilterDeveloper("")
    setFilterName("")
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bienvenido, {firstName}</h1>
        <p className="text-muted-foreground">{orgName} · Panel de control</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/projects" className="col-span-1">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4 px-5">
              <FolderKanban className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-2xl font-bold leading-none">{filteredProjects.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveFilters ? "Proyectos filtrados" : "Proyectos"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Placeholder — Subestaciones (Fase 2) */}
        <Card className="col-span-1 opacity-40 cursor-not-allowed">
          <CardContent className="flex items-center gap-3 py-4 px-5">
            <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
            <div>
              <p className="text-2xl font-bold leading-none">—</p>
              <p className="text-xs text-muted-foreground mt-1">Subestaciones</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={filterOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterOpen((v) => !v)}
            className="gap-2"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtrar
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary-foreground text-primary text-xs px-1.5 py-0.5 leading-none font-semibold">
                {[filterTech, filterPowerMin, filterDeveloper, filterName].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {filteredProjects.length} de {projects.length} proyectos
            </span>
          )}
        </div>

        {filterOpen && (
          <div className="rounded-md border bg-card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Nombre</label>
              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Tecnología */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Tecnología</label>
              <select
                value={filterTech}
                onChange={(e) => setFilterTech(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todas</option>
                {techOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Potencia mínima */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Potencia mín. (MW)
              </label>
              <input
                type="number"
                min={0}
                placeholder="Ej: 50"
                value={filterPowerMin}
                onChange={(e) => setFilterPowerMin(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Developer */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Developer (Partner)</label>
              <input
                type="text"
                placeholder="Buscar developer..."
                value={filterDeveloper}
                onChange={(e) => setFilterDeveloper(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="flex-1">
        <DashboardMapDynamic markers={visibleMarkers} height={550} />
        {allMarkers.length === 0 && projects.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Ningún proyecto tiene geometría definida aún — añade coordenadas desde el detalle del proyecto para verlos en el mapa.
          </p>
        )}
      </div>
    </div>
  )
}
