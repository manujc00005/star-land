import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjectById } from "@/services/project.service"
import { getProjectParcels } from "@/services/project-parcel.service"
import { getContractsByProject } from "@/services/contract.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { DeleteProjectButton } from "@/components/projects/delete-project-button"
import { GeometryEditor } from "@/components/projects/geometry-editor"
import { RemoveParcelButton } from "@/components/projects/parcels/remove-parcel-button"
import { DetectParcelsButton } from "@/components/projects/detect-parcels-button"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { ContractTypeBadge } from "@/components/contracts/contract-type-badge"
import { updateProjectGeometryAction } from "@/actions/project"
import { ArrowLeft, Download } from "lucide-react"
import type { GeoMapFeature } from "@/components/map/geo-map"
import { GeoMapLoader } from "@/components/map/geo-map-loader"

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

  // Vinculamos la action al id del proyecto — patrón idéntico al de edit
  const boundGeometryAction = updateProjectGeometryAction.bind(null, id)

  // Serializar geometry para el componente cliente
  const geometryString = project.geometry
    ? JSON.stringify(project.geometry, null, 2)
    : null

  // Tipo de geometry para la cabecera de la sección
  const geometryType =
    project.geometry &&
    typeof project.geometry === "object" &&
    !Array.isArray(project.geometry) &&
    "type" in project.geometry
      ? String((project.geometry as { type: unknown }).type)
      : null

  // ── Mapa ──────────────────────────────────────────────────────────────
  // IDs de parcelas que tienen al menos un contrato
  const parcelIdsWithContract = new Set(projectContracts.map((c) => c.parcel.id))

  const mapFeatures: GeoMapFeature[] = []

  // Recinto del proyecto — azul
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

  // Parcelas vinculadas — verde si tienen contrato, ámbar si no
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

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Proyectos
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/projects/${id}/export/kml`} download>
              <Download className="h-4 w-4 mr-1.5" />
              Exportar KML
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${id}/edit`}>Editar</Link>
          </Button>
          <DeleteProjectButton id={id} />
        </div>
      </div>

      {/* Datos generales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Nombre</span>
            <span className="font-medium">{project.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Potencia</span>
            <span className="font-medium">{project.powerMW} MW</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Estado</span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">Creado</span>
            <span>
              {project.createdAt.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-28 shrink-0">
              Actualizado
            </span>
            <span>
              {project.updatedAt.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mapa del proyecto */}
      {mapFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa</CardTitle>
            <CardDescription>
              Recinto del proyecto y parcelas vinculadas ·{" "}
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-blue-600 bg-blue-500/20" />
                Recinto
                <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-green-600 bg-green-500/35 ml-1" />
                Con contrato
                <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-amber-600 bg-amber-500/35 ml-1" />
                Sin contrato
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <GeoMapLoader features={mapFeatures} height={380} />
          </CardContent>
        </Card>
      )}

      {/* Recinto del proyecto */}
      <Card>
        <CardHeader>
          <CardTitle>Recinto del proyecto</CardTitle>
          <CardDescription>
            Área geográfica en formato GeoJSON · Polygon o MultiPolygon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview de la geometry existente */}
          {geometryString && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tipo actual:</span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-medium">
                  {geometryType}
                </code>
              </div>
              <pre className="overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed max-h-52">
                {geometryString}
              </pre>
            </div>
          )}

          {/* Editor siempre visible — vaciar = eliminar */}
          <GeometryEditor
            action={boundGeometryAction}
            currentGeometry={geometryString}
          />
        </CardContent>
      </Card>

      {/* Parcelas afectadas */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>
              Parcelas afectadas
              {projectParcels.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({projectParcels.length})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Parcelas catastrales vinculadas a este proyecto
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${id}/parcels`}>Gestionar</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetectParcelsButton projectId={id} />

          {projectParcels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin parcelas asignadas.{" "}
              <Link
                href={`/projects/${id}/parcels`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Añadir parcelas manualmente
              </Link>
            </p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Ref. catastral
                    </th>
                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                      Superficie
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Uso del suelo
                    </th>
                    <th className="py-2 px-1 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {projectParcels.map((pp) => (
                    <tr key={pp.id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono text-xs">
                        <Link
                          href={`/parcels/${pp.parcel.id}`}
                          className="text-primary hover:underline underline-offset-4"
                        >
                          {pp.parcel.cadastralRef}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                        {pp.parcel.surface.toLocaleString("es-ES")} m²
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs truncate max-w-48">
                        {pp.parcel.landUse ?? "—"}
                      </td>
                      <td className="py-2 px-1 text-right">
                        <RemoveParcelButton
                          projectId={id}
                          parcelId={pp.parcel.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contratos del proyecto */}
      <Card>
        <CardHeader>
          <CardTitle>
            Contratos del proyecto
            {projectContracts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({projectContracts.length})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Contratos sobre las parcelas vinculadas a este proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {projectParcels.length === 0
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
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Propietario
                    </th>
                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                      Precio
                    </th>
                    <th className="py-2 px-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {projectContracts.map((c) => (
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
                      <td className="py-2 px-3">
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
  )
}
