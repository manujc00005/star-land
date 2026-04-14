"use client"

import { useState, useMemo, Fragment } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GeoMapLoader } from "@/components/map/geo-map-loader"
import { RemoveParcelButton } from "@/components/projects/parcels/remove-parcel-button"
import { AffectationSelect } from "@/components/projects/parcels/affectation-select"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import type { GeoMapFeature } from "@/components/map/geo-map"
import type { ContractType, ContractStatus } from "@/lib/validations/contract"
import {
  type NegotiationStatus,
  NEGOTIATION_STATUS_STYLES,
} from "@/lib/validations/negotiation-status"
import { Plus, ChevronRight, Download } from "lucide-react"
import { ParcelPanel } from "@/components/projects/parcels/parcel-panel"

// ── Tipos serializables ────────────────────────────────────────────────────────

export type PanelOwner = {
  id: string
  name: string
  nif: string
}

export type TabContact = {
  id: string
  name: string
  role: string
  phone: string | null
  email: string | null
  notes: string | null
}

export type TabParcel = {
  id: string
  affectation: string | null
  notes: string | null
  negotiationStatus: NegotiationStatus
  contacts: TabContact[]
  parcel: {
    id: string
    cadastralRef: string
    surface: number
    municipality: string | null
    landUse: string | null
  }
  contracts: TabContract[]
  primaryOwnerName: string | null
  primaryOwnerId: string | null
}

export type TabContract = {
  id: string
  type: ContractType
  status: ContractStatus
  price: number | null
  signedAt: Date | null
  nextStep: string | null
  nextStepDate: Date | null
  parcels: { id: string; cadastralRef: string; municipality: string | null; surface: number }[]
  owner: { id: string; name: string }
}

type Props = {
  projectId: string
  mapFeatures: GeoMapFeature[]
  parcels: TabParcel[]
  contracts: TabContract[]
  owners: PanelOwner[]
  technologies: { type: string; powerMW?: number }[]
}

type Tab = "terrenos" | "permitting"
type ContractSortField = "municipality" | "parcel" | "surface" | "owner" | "status" | "nextStep" | "signedAt"

// ── Componente principal ───────────────────────────────────────────────────────

export function ProjectTabs({
  projectId,
  mapFeatures,
  parcels,
  contracts,
  owners,
  technologies,
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("terrenos")
  const [expandedParcelId, setExpandedParcelId] = useState<string | null>(null)
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<ContractSortField | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  function toggleParcelExpand(id: string) {
    setExpandedParcelId((prev) => (prev === id ? null : id))
  }

  function toggleContractExpand(id: string) {
    setExpandedContractId((prev) => (prev === id ? null : id))
  }

  function toggleSort(field: ContractSortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sortedContracts = useMemo(() => {
    if (!sortField) return contracts
    return [...contracts].sort((a, b) => {
      let va: string | number
      let vb: string | number
      switch (sortField) {
        case "municipality": {
          const ma = a.parcels.map((p) => p.municipality).filter(Boolean).sort()
          const mb = b.parcels.map((p) => p.municipality).filter(Boolean).sort()
          va = (ma[0] as string) ?? ""
          vb = (mb[0] as string) ?? ""
          break
        }
        case "parcel":
          va = a.parcels[0]?.cadastralRef ?? ""
          vb = b.parcels[0]?.cadastralRef ?? ""
          break
        case "surface":
          va = a.parcels.reduce((s, p) => s + p.surface, 0)
          vb = b.parcels.reduce((s, p) => s + p.surface, 0)
          break
        case "owner":
          va = a.owner.name
          vb = b.owner.name
          break
        case "status":
          va = a.status
          vb = b.status
          break
        case "nextStep":
          va = a.nextStep ?? ""
          vb = b.nextStep ?? ""
          break
        case "signedAt":
          va = a.signedAt ? new Date(a.signedAt).getTime() : 0
          vb = b.signedAt ? new Date(b.signedAt).getTime() : 0
          break
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [contracts, sortField, sortDir])

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="inline-flex rounded-lg bg-muted p-1">
        <TabButton
          active={activeTab === "terrenos"}
          onClick={() => setActiveTab("terrenos")}
        >
          Gestión Terrenos
          {parcels.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-normal tabular-nums">
              {parcels.length}
            </span>
          )}
        </TabButton>
        <TabButton
          active={activeTab === "permitting"}
          onClick={() => setActiveTab("permitting")}
        >
          Permitting
        </TabButton>
      </div>

      {/* ── Tab: Gestión Terrenos ────────────────────────────────────────────── */}
      {activeTab === "terrenos" && (
        <div className="space-y-4">

          {/* ── Split Panel: Resumen + Mapa Satélite ── */}
          <Card>
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-5 grid-cols-1">
                {/* Izquierda: Resumen de superficie (40%) */}
                <div className="lg:col-span-2 p-5 lg:border-r border-b lg:border-b-0">
                  <SurfaceSummary parcels={parcels} technologies={technologies} />
                </div>
                {/* Derecha: Mapa satélite (60%) */}
                <div className="lg:col-span-3 relative">
                  {mapFeatures.length > 0 ? (
                    <>
                      <GeoMapLoader features={mapFeatures} height={340} satellite />
                      <a
                        href={`/api/projects/${projectId}/export/kml`}
                        download
                        className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-md bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium shadow-sm border hover:bg-background transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Exportar KMZ
                      </a>
                      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 rounded-md bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs">
                        <LegendDot color="blue" label="Recinto" />
                        <LegendDot color="green" label="Con contrato" />
                        <LegendDot color="amber" label="Sin contrato" />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[340px] text-sm text-muted-foreground">
                      Sin geometría para mostrar en el mapa
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Contratos ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Contratos
                    {contracts.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({contracts.length})
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Contratos sobre las parcelas vinculadas
                  </CardDescription>
                </div>
                {parcels.length > 0 && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/contracts/new">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Añadir Contrato
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {parcels.length === 0
                    ? "Asigna parcelas al proyecto para ver sus contratos."
                    : "Las parcelas de este proyecto no tienen contratos asociados."}
                </p>
              ) : (
                <div className="overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="py-2 px-2 w-8" />
                        <SortableHeader field="municipality" label="Municipio" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-left hidden lg:table-cell" />
                        <SortableHeader field="parcel" label="Parcela/s" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-left" />
                        <SortableHeader field="surface" label="Sup. Catastral" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-right hidden md:table-cell" />
                        <SortableHeader field="owner" label="Propietario/s" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-left hidden md:table-cell" />
                        <SortableHeader field="status" label="Estado" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-left" />
                        <SortableHeader field="nextStep" label="Next Step" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-left hidden lg:table-cell" />
                        <SortableHeader field="signedAt" label="Fecha Firma" currentField={sortField} currentDir={sortDir} onSort={toggleSort} className="text-left hidden lg:table-cell" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedContracts.map((c) => {
                        const municipalities = [...new Set(
                          c.parcels.map((p) => p.municipality).filter(Boolean)
                        )].sort() as string[]
                        const firstMunicipality = municipalities[0] ?? "—"
                        const extraMunicipalities = municipalities.length - 1
                        const firstParcel = c.parcels[0]
                        const extraParcels = c.parcels.length - 1
                        const totalSurface = c.parcels.reduce((s, p) => s + p.surface, 0)
                        const isExpired = c.status === "EXPIRED"
                        const isExpanded = expandedContractId === c.id

                        return (
                          <Fragment key={c.id}>
                            <tr
                              className={[
                                "border-b last:border-0 transition-colors",
                                isExpired ? "bg-muted/15" : "hover:bg-muted/20",
                                isExpanded ? "bg-muted/30" : "",
                                "cursor-pointer",
                              ].join(" ")}
                              onClick={() => router.push(`/contracts/${c.id}`)}
                            >
                              {/* Expand toggle */}
                              <td className="py-2 px-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleContractExpand(c.id)
                                  }}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  title={isExpanded ? "Colapsar" : "Expandir detalles"}
                                >
                                  <ChevronRight
                                    className={[
                                      "h-4 w-4 transition-transform duration-150",
                                      isExpanded ? "rotate-90" : "",
                                    ].join(" ")}
                                  />
                                </button>
                              </td>

                              {/* Municipio */}
                              <td className="py-2 px-3 text-xs hidden lg:table-cell">
                                {firstMunicipality}
                                {extraMunicipalities > 0 && (
                                  <span className="ml-1 text-muted-foreground">
                                    (+{extraMunicipalities})
                                  </span>
                                )}
                              </td>

                              {/* Parcela/s */}
                              <td className="py-2 px-3 font-mono text-xs">
                                {firstParcel?.cadastralRef ?? "—"}
                                {extraParcels > 0 && (
                                  <span className="ml-1 font-sans text-muted-foreground">
                                    (+{extraParcels})
                                  </span>
                                )}
                              </td>

                              {/* Superficie Catastral total */}
                              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                                {totalSurface.toLocaleString("es-ES")} m²
                              </td>

                              {/* Propietario/s */}
                              <td className="py-2 px-3 hidden md:table-cell">
                                {c.owner.name}
                              </td>

                              {/* Estado */}
                              <td className="py-2 px-3">
                                <ContractStatusBadge status={c.status} />
                              </td>

                              {/* Next Step */}
                              <td className="py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell">
                                {c.nextStep ?? "—"}
                              </td>

                              {/* Fecha Firma */}
                              <td className="py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell">
                                {c.signedAt
                                  ? new Date(c.signedAt).toLocaleDateString("es-ES")
                                  : "—"}
                              </td>
                            </tr>

                            {/* Panel expandible (placeholder — Fase 4) */}
                            {isExpanded && (
                              <tr className={isExpired ? "bg-muted/15" : "bg-muted/30"}>
                                <td colSpan={8} className="px-6 py-4 border-b">
                                  <p className="text-xs text-muted-foreground italic">
                                    Panel de edición rápida — disponible en la siguiente fase.
                                  </p>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Parcelas afectadas ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Parcelas afectadas
                    {parcels.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({parcels.length})
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Parcelas catastrales vinculadas a este proyecto
                  </CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href={`/projects/${projectId}/parcels`}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Añadir parcelas
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {parcels.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Sin parcelas asignadas.{" "}
                  <Link
                    href={`/projects/${projectId}/parcels`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Añadir parcelas
                  </Link>
                </p>
              ) : (
                <div className="overflow-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground">
                        <th className="py-2 px-2 w-8" />
                        <th className="py-2 px-3 text-left font-medium hidden lg:table-cell">
                          Municipio
                        </th>
                        <th className="py-2 px-3 text-left font-medium">
                          Ref. Catastral
                        </th>
                        <th className="py-2 px-3 text-right font-medium hidden md:table-cell">
                          Superficie
                        </th>
                        <th className="py-2 px-3 text-left font-medium">
                          Estado Contratación
                        </th>
                        <th className="py-2 px-3 text-left font-medium hidden md:table-cell">
                          Propietario
                        </th>
                        <th className="py-2 px-3 text-left font-medium">
                          Afección
                        </th>
                        <th className="py-2 px-1 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {parcels.map((pp) => {
                        const isExpanded = expandedParcelId === pp.id
                        return (
                          <Fragment key={pp.id}>
                            <tr className="border-b last:border-0 hover:bg-muted/20">
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => toggleParcelExpand(pp.id)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  title={isExpanded ? "Colapsar" : "Expandir detalles"}
                                >
                                  <ChevronRight
                                    className={[
                                      "h-4 w-4 transition-transform duration-150",
                                      isExpanded ? "rotate-90" : "",
                                    ].join(" ")}
                                  />
                                </button>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground text-xs hidden lg:table-cell">
                                {pp.parcel.municipality ?? "—"}
                              </td>
                              <td className="py-2 px-3 font-mono text-xs">
                                <Link
                                  href={`/parcels/${pp.parcel.id}`}
                                  className="text-primary hover:underline underline-offset-4"
                                >
                                  {pp.parcel.cadastralRef}
                                </Link>
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                                {pp.parcel.surface.toLocaleString("es-ES")} m²
                              </td>
                              <td className="py-2 px-3">
                                <ContractingStatusBadge status={pp.negotiationStatus} />
                              </td>
                              <td className="py-2 px-3 hidden md:table-cell">
                                {pp.primaryOwnerName && pp.primaryOwnerId ? (
                                  <Link
                                    href={`/owners/${pp.primaryOwnerId}`}
                                    className="hover:underline underline-offset-4 text-sm"
                                  >
                                    {pp.primaryOwnerName}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <AffectationSelect
                                  projectParcelId={pp.id}
                                  projectId={projectId}
                                  value={pp.affectation}
                                />
                              </td>
                              <td className="py-2 px-1 text-right">
                                <RemoveParcelButton
                                  projectId={projectId}
                                  parcelId={pp.parcel.id}
                                />
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b bg-muted/10">
                                <td colSpan={8} className="px-4 py-4">
                                  <ParcelPanel
                                    projectParcelId={pp.id}
                                    projectId={projectId}
                                    parcelId={pp.parcel.id}
                                    notes={pp.notes}
                                    negotiationStatus={pp.negotiationStatus}
                                    contracts={pp.contracts}
                                    contacts={pp.contacts}
                                    owners={owners}
                                  />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* ── Tab: Permitting ──────────────────────────────────────────────────── */}
      {activeTab === "permitting" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="font-medium text-muted-foreground">Permitting</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Expedientes, licencias y permisos administrativos.
              Disponible en una próxima fase.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 text-sm font-medium rounded-md transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function SortableHeader({
  field,
  label,
  currentField,
  currentDir,
  onSort,
  className,
}: {
  field: ContractSortField
  label: string
  currentField: ContractSortField | null
  currentDir: "asc" | "desc"
  onSort: (f: ContractSortField) => void
  className?: string
}) {
  const isActive = currentField === field
  return (
    <th
      className={[
        "py-2 px-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap",
        className,
      ].join(" ")}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${isActive ? "opacity-100" : "opacity-30"}`}>
          {isActive ? (currentDir === "asc" ? "\u25B2" : "\u25BC") : "\u21C5"}
        </span>
      </span>
    </th>
  )
}

function SurfaceSummary({
  parcels,
  technologies,
}: {
  parcels: TabParcel[]
  technologies: { type: string; powerMW?: number }[]
}) {
  const LINE_AFFECTATION = "Línea de alta tensión"
  const plantParcels = parcels.filter(
    (p) => p.affectation != null && p.affectation !== LINE_AFFECTATION
  )
  const lineParcels = parcels.filter(
    (p) => p.affectation === LINE_AFFECTATION
  )
  const techLabel =
    technologies.length > 0
      ? technologies.map((t) => t.type).join(" / ")
      : "Renovable"

  function breakdown(list: TabParcel[]) {
    return {
      signed: list.filter((p) => p.negotiationStatus === "SIGNED").length,
      negotiating: list.filter((p) => p.negotiationStatus === "NEGOTIATING").length,
      searching: list.filter((p) => p.negotiationStatus === "SEARCHING").length,
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Parcelas totales
        </p>
        <p className="text-3xl font-bold tabular-nums">{parcels.length}</p>
      </div>

      {plantParcels.length > 0 && (
        <BreakdownBlock
          label={`Planta de ${techLabel}`}
          total={plantParcels.length}
          data={breakdown(plantParcels)}
        />
      )}

      {lineParcels.length > 0 && (
        <BreakdownBlock
          label="Línea de Evacuación"
          total={lineParcels.length}
          data={breakdown(lineParcels)}
        />
      )}
    </div>
  )
}

function BreakdownBlock({
  label,
  total,
  data,
}: {
  label: string
  total: number
  data: { signed: number; negotiating: number; searching: number }
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-lg font-bold tabular-nums">{total} parcelas</p>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground pl-2">
        <p>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 align-middle" />
          Firmadas: {data.signed}
        </p>
        <p>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5 align-middle" />
          En negociación: {data.negotiating}
        </p>
        <p>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5 align-middle" />
          En búsqueda: {data.searching}
        </p>
      </div>
    </div>
  )
}

const LEGEND_COLORS = {
  blue:  "border-blue-600 bg-blue-500/20",
  green: "border-green-600 bg-green-500/35",
  amber: "border-amber-600 bg-amber-500/35",
} as const

function LegendDot({
  color,
  label,
}: {
  color: keyof typeof LEGEND_COLORS
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-sm border-2 ${LEGEND_COLORS[color]}`}
      />
      {label}
    </span>
  )
}

function ContractingStatusBadge({ status }: { status: NegotiationStatus }) {
  const style = NEGOTIATION_STATUS_STYLES[status] ?? {
    label: status ?? "—",
    className: "bg-gray-100 text-gray-600",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  )
}
