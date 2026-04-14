"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { FolderKanban, Filter, X, ChevronDown, Check } from "lucide-react"
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
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())

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
    filterTech !== "" || filterPowerMin !== "" || filterDeveloper !== "" || selectedProjectIds.size > 0

  // Apply filters
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedProjectIds.size > 0 && !selectedProjectIds.has(p.id)) return false
      if (filterTech && !p.technologies.some((t) => t.type === filterTech)) return false
      if (filterDeveloper && !(p.developer ?? "").toLowerCase().includes(filterDeveloper.toLowerCase())) return false
      if (filterPowerMin) {
        const min = parseFloat(filterPowerMin)
        if (!isNaN(min) && (p.powerMW == null || p.powerMW < min)) return false
      }
      return true
    })
  }, [projects, selectedProjectIds, filterTech, filterDeveloper, filterPowerMin])

  // Only show map markers for filtered projects that have geometry
  const filteredMarkerIds = new Set(filteredProjects.map((p) => p.id))
  const visibleMarkers = allMarkers.filter((m) => filteredMarkerIds.has(m.id))

  const clearFilters = () => {
    setFilterTech("")
    setFilterPowerMin("")
    setFilterDeveloper("")
    setSelectedProjectIds(new Set())
  }

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllProjects = () => {
    if (selectedProjectIds.size === projects.length) {
      setSelectedProjectIds(new Set())
    } else {
      setSelectedProjectIds(new Set(projects.map((p) => p.id)))
    }
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
                {[filterTech, filterPowerMin, filterDeveloper, selectedProjectIds.size > 0 ? "x" : ""].filter(Boolean).length}
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
          <div className="relative z-[1100] rounded-md border bg-card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Proyectos (multi-select) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Proyecto</label>
              <ProjectMultiSelect
                projects={projects}
                selected={selectedProjectIds}
                onToggle={toggleProject}
                onToggleAll={toggleAllProjects}
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

// ── Multi-select dropdown for projects ────────────────────────────────────────

function ProjectMultiSelect({
  projects,
  selected,
  onToggle,
  onToggleAll,
}: {
  projects: ProjectSummary[]
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const allSelected = selected.size === projects.length
  const label =
    selected.size === 0
      ? "Todos los proyectos"
      : selected.size === 1
        ? projects.find((p) => selected.has(p.id))?.name ?? "1 proyecto"
        : `${selected.size} proyectos`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <span className={selected.size === 0 ? "text-muted-foreground" : ""}>
          {label}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-[1100] mt-1 w-full rounded-md border bg-popover shadow-md">
          {/* Select all */}
          <button
            type="button"
            onClick={onToggleAll}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent border-b"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                allSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
              }`}
            >
              {allSelected && <Check className="h-3 w-3" />}
            </span>
            <span className="font-medium">Todos</span>
          </button>

          {/* Project list */}
          <div className="max-h-56 overflow-y-auto py-1">
            {projects.map((p) => {
              const isSelected = selected.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{p.name}</span>
                  {p.powerMW != null && (
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {p.powerMW} MW
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
