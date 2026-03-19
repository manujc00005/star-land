"use client"

import { useState, Fragment } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GeoMapLoader } from "@/components/map/geo-map-loader"
import { DetectParcelsButton } from "@/components/projects/detect-parcels-button"
import { RemoveParcelButton } from "@/components/projects/parcels/remove-parcel-button"
import { AffectationSelect } from "@/components/projects/parcels/affectation-select"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { ContractTypeBadge } from "@/components/contracts/contract-type-badge"
import type { GeoMapFeature } from "@/components/map/geo-map"
import type { ContractType, ContractStatus } from "@/lib/validations/contract"
import {
  type NegotiationStatus,
  NEGOTIATION_STATUS_STYLES,
} from "@/lib/validations/negotiation-status"
import { Download, Plus, ChevronRight } from "lucide-react"
import { ParcelPanel } from "@/components/projects/parcels/parcel-panel"

// ── Tipos serializables ────────────────────────────────────────────────────────

/**
 * Propietario mínimo para el selector del panel de parcela.
 * Sólo los campos necesarios para el dropdown — evita pasar datos sensibles al cliente.
 */
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
  id: string           // ProjectParcel.id
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
  // Todos los contratos de esta parcela (ACTIVE primero, luego DRAFT, luego EXPIRED)
  contracts: TabContract[]
  // Propietario del contrato más relevante — para mostrar en la columna de tabla
  primaryOwnerName: string | null
  primaryOwnerId: string | null
}

export type TabContract = {
  id: string
  type: ContractType
  status: ContractStatus
  price: number | null
  signedAt: Date | null
  parcel: { id: string; cadastralRef: string }
  owner: { id: string; name: string }
}

type Props = {
  projectId: string
  mapFeatures: GeoMapFeature[]
  parcels: TabParcel[]
  contracts: TabContract[]
  owners: PanelOwner[]
}

type Tab = "terrenos" | "permitting"

// ── Componente principal ───────────────────────────────────────────────────────

export function ProjectTabs({
  projectId,
  mapFeatures,
  parcels,
  contracts,
  owners,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("terrenos")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b">
        <TabButton
          active={activeTab === "terrenos"}
          onClick={() => setActiveTab("terrenos")}
        >
          Gestión Terrenos
          {parcels.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal tabular-nums">
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
          {/* Mapa */}
          {mapFeatures.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mapa</CardTitle>
                <CardDescription className="flex items-center gap-3 text-xs">
                  <LegendDot color="blue" label="Recinto" />
                  <LegendDot color="green" label="Con contrato vigente" />
                  <LegendDot color="amber" label="Sin contrato vigente" />
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <GeoMapLoader features={mapFeatures} height={340} />
              </CardContent>
            </Card>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DetectParcelsButton projectId={projectId} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="outline" size="sm">
                <a href={`/api/projects/${projectId}/export/kml`} download>
                  <Download className="h-4 w-4 mr-1.5" />
                  Exportar KML
                </a>
              </Button>
              <Button asChild size="sm">
                <Link href={`/projects/${projectId}/parcels`}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Añadir parcelas
                </Link>
              </Button>
            </div>
          </div>

          {/* Tabla de parcelas */}
          <Card>
            <CardHeader className="pb-3">
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
                        const isExpanded = expandedId === pp.id
                        return (
                          <Fragment key={pp.id}>
                            <tr
                              className="border-b last:border-0 hover:bg-muted/20"
                            >
                              {/* Expand toggle */}
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => toggleExpand(pp.id)}
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
                              <td className="py-2 px-3 text-muted-foreground text-xs hidden lg:table-cell">
                                {pp.parcel.municipality ?? "—"}
                              </td>

                              {/* Ref. Catastral */}
                              <td className="py-2 px-3 font-mono text-xs">
                                <Link
                                  href={`/parcels/${pp.parcel.id}`}
                                  className="text-primary hover:underline underline-offset-4"
                                >
                                  {pp.parcel.cadastralRef}
                                </Link>
                              </td>

                              {/* Superficie */}
                              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">
                                {pp.parcel.surface.toLocaleString("es-ES")} m²
                              </td>

                              {/* Estado Contratación */}
                              <td className="py-2 px-3">
                                <ContractingStatusBadge
                                  status={pp.negotiationStatus}
                                />
                              </td>

                              {/* Propietario */}
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

                              {/* Afección */}
                              <td className="py-2 px-3">
                                <AffectationSelect
                                  projectParcelId={pp.id}
                                  projectId={projectId}
                                  value={pp.affectation}
                                />
                              </td>

                              {/* Eliminar */}
                              <td className="py-2 px-1 text-right">
                                <RemoveParcelButton
                                  projectId={projectId}
                                  parcelId={pp.parcel.id}
                                />
                              </td>
                            </tr>

                            {/* Panel expandible */}
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

          {/* Contratos */}
          <Card>
            <CardHeader className="pb-3">
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
                        <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                          Parcela
                        </th>
                        <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                          Tipo
                        </th>
                        <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                          Estado
                        </th>
                        <th className="py-2 px-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                          Propietario
                        </th>
                        <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                          Precio
                        </th>
                        <th className="py-2 px-3 w-16" />
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((c) => (
                        <tr key={c.id} className="border-b last:border-0">
                          <td className="py-2 px-3 font-mono text-xs">
                            <Link
                              href={`/parcels/${c.parcel.id}`}
                              className="text-primary hover:underline underline-offset-4"
                            >
                              {c.parcel.cadastralRef}
                            </Link>
                          </td>
                          <td className="py-2 px-3">
                            <ContractTypeBadge type={c.type} />
                          </td>
                          <td className="py-2 px-3">
                            <ContractStatusBadge status={c.status} />
                          </td>
                          <td className="py-2 px-3 hidden md:table-cell">
                            <Link
                              href={`/owners/${c.owner.id}`}
                              className="hover:underline underline-offset-4"
                            >
                              {c.owner.name}
                            </Link>
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                            {c.price != null
                              ? `${c.price.toLocaleString("es-ES")} €`
                              : "—"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/contracts/${c.id}`}>Ver</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
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
        "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
      ].join(" ")}
    >
      {children}
    </button>
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
  const style = NEGOTIATION_STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  )
}
