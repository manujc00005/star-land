import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjectById } from "@/services/project.service"
import { getProjectParcels } from "@/services/project-parcel.service"
import { getContractsByProject } from "@/services/contract.service"
import { getContactsByParcelIds } from "@/services/parcel-contact.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { DeleteProjectButton } from "@/components/projects/delete-project-button"
import { ProjectTabs } from "@/components/projects/project-tabs"
import type { TabParcel, TabContract, TabContact } from "@/components/projects/project-tabs"
import { type Technology } from "@/lib/validations/project"
import { ArrowLeft, Download, Zap, Cable, Building2 } from "lucide-react"
import type { GeoMapFeature } from "@/components/map/geo-map"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const [project, projectParcels, projectContracts] = await Promise.all([
    getProjectById(ctx, id),
    getProjectParcels(ctx, id),
    getContractsByProject(ctx, id),
  ])

  const parcelIds = projectParcels.map((pp) => pp.parcel.id)
  const allContacts = await getContactsByParcelIds(ctx, parcelIds)

  // Agrupar contactos por parcelId para lookup rápido
  const contactsByParcelId = new Map<string, typeof allContacts>()
  for (const contact of allContacts) {
    const list = contactsByParcelId.get(contact.parcelId) ?? []
    list.push(contact)
    contactsByParcelId.set(contact.parcelId, list)
  }

  // ── Mapa ───────────────────────────────────────────────────────────────────
  const parcelIdsWithContract = new Set(projectContracts.map((c) => c.parcel.id))
  const mapFeatures: GeoMapFeature[] = []

  if (
    project.geometry &&
    typeof project.geometry === "object" &&
    !Array.isArray(project.geometry)
  ) {
    mapFeatures.push({
      id: `project-${project.id}`,
      geometry: project.geometry as Record<string, unknown>,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      weight: 3,
      popup: `<strong>${project.name}</strong><br/>Recinto del proyecto`,
    })
  }

  for (const pp of projectParcels) {
    if (
      pp.parcel.geometry &&
      typeof pp.parcel.geometry === "object" &&
      !Array.isArray(pp.parcel.geometry)
    ) {
      const hasContract = parcelIdsWithContract.has(pp.parcel.id)
      mapFeatures.push({
        id: `parcel-${pp.parcel.id}`,
        geometry: pp.parcel.geometry as Record<string, unknown>,
        color: hasContract ? "#16a34a" : "#d97706",
        fillColor: hasContract ? "#22c55e" : "#f59e0b",
        fillOpacity: 0.35,
        weight: 2,
        popup: `<strong>${pp.parcel.cadastralRef}</strong><br/>${hasContract ? "✅ Con contrato" : "⏳ Sin contrato"}${pp.parcel.surface ? `<br/>${pp.parcel.surface.toLocaleString("es-ES")} m²` : ""}`,
      })
    }
  }

  // ── Datos para tabs ────────────────────────────────────────────────────────
  // Índice contratos por parcelId — prioridad ACTIVE > DRAFT > EXPIRED
  const CONTRACT_PRIORITY: Record<string, number> = {
    ACTIVE: 0,
    DRAFT: 1,
    EXPIRED: 2,
  }
  const bestContractByParcel = new Map<
    string,
    (typeof projectContracts)[number]
  >()
  for (const c of projectContracts) {
    const current = bestContractByParcel.get(c.parcel.id)
    if (
      !current ||
      (CONTRACT_PRIORITY[c.status] ?? 99) <
        (CONTRACT_PRIORITY[current.status] ?? 99)
    ) {
      bestContractByParcel.set(c.parcel.id, c)
    }
  }

  const tabParcels: TabParcel[] = projectParcels.map((pp) => {
    const contract = bestContractByParcel.get(pp.parcel.id) ?? null
    const rawContacts = contactsByParcelId.get(pp.parcel.id) ?? []
    const contacts: TabContact[] = rawContacts.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
    }))
    return {
      id: pp.id,
      affectation: pp.affectation,
      notes: pp.notes,
      contacts,
      parcel: {
        id: pp.parcel.id,
        cadastralRef: pp.parcel.cadastralRef,
        surface: pp.parcel.surface,
        municipality: pp.parcel.municipality,
        landUse: pp.parcel.landUse,
      },
      contractStatus: contract?.status ?? null,
      contractType: contract?.type ?? null,
      contractId: contract?.id ?? null,
      ownerName: contract?.owner.name ?? null,
      ownerId: contract?.owner.id ?? null,
    }
  })

  const tabContracts: TabContract[] = projectContracts.map((c) => ({
    id: c.id,
    type: c.type,
    status: c.status,
    price: c.price,
    signedAt: c.signedAt,
    parcel: { id: c.parcel.id, cadastralRef: c.parcel.cadastralRef },
    owner: { id: c.owner.id, name: c.owner.name },
  }))

  // ── Tecnologías y datos de resumen ────────────────────────────────────────
  const technologies = Array.isArray(project.technologies)
    ? (project.technologies as Technology[])
    : []

  return (
    <div className="space-y-4">
      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Proyectos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {project.name}
          </h1>
          <ProjectStatusBadge status={project.status} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/projects/${id}/export/kml`} download>
              <Download className="h-4 w-4 mr-1.5" />
              KML
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${id}/edit`}>Editar</Link>
          </Button>
          <DeleteProjectButton id={id} />
        </div>
      </div>

      {/* ── Bloque fijo de datos clave ────────────────────────────────────── */}
      {(technologies.length > 0 ||
        project.powerMW != null ||
        project.connectionPoints.length > 0 ||
        project.spv) && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {/* Tecnologías */}
              {technologies.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {technologies.map((t, i) => (
                      <span key={i} className="font-medium">
                        {t.type}
                        {t.powerMW != null && (
                          <span className="text-muted-foreground font-normal ml-1">
                            {t.powerMW} MW
                          </span>
                        )}
                        {i < technologies.length - 1 && (
                          <span className="text-muted-foreground mx-1">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Potencia total (solo si hay más de 1 tecnología con MW) */}
              {project.powerMW != null && technologies.length > 1 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-xs">Total:</span>
                  <span className="font-medium text-foreground">
                    {project.powerMW} MW
                  </span>
                </div>
              )}

              {/* Puntos de conexión */}
              {project.connectionPoints.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Cable className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {project.connectionPoints.map((cp) => (
                      <span key={cp} className="font-medium">
                        {cp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SPV */}
              {project.spv && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">{project.spv}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <ProjectTabs
        projectId={id}
        mapFeatures={mapFeatures}
        parcels={tabParcels}
        contracts={tabContracts}
      />
    </div>
  )
}
