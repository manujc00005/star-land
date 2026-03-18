import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getParcelById } from "@/services/parcel.service"
import { getParcelProjects } from "@/services/project-parcel.service"
import { getContractsByParcel } from "@/services/contract.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { ContractTypeBadge } from "@/components/contracts/contract-type-badge"
import { DeleteParcelButton } from "@/components/parcels/delete-parcel-button"
import { ArrowLeft } from "lucide-react"
import type { GeoMapFeature } from "@/components/map/geo-map"
import { GeoMapLoader } from "@/components/map/geo-map-loader"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ParcelDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const [parcel, parcelProjects, parcelContracts] = await Promise.all([
    getParcelById(ctx, id),
    getParcelProjects(ctx, id),
    getContractsByParcel(ctx, id),
  ])

  const geometryString = parcel.geometry
    ? JSON.stringify(parcel.geometry, null, 2)
    : null

  const geometryType =
    parcel.geometry &&
    typeof parcel.geometry === "object" &&
    !Array.isArray(parcel.geometry) &&
    "type" in parcel.geometry
      ? String((parcel.geometry as { type: unknown }).type)
      : null

  // ── Mapa ──────────────────────────────────────────────────────────────
  const mapFeatures: GeoMapFeature[] = []

  // Parcela — verde
  if (
    parcel.geometry &&
    typeof parcel.geometry === "object" &&
    !Array.isArray(parcel.geometry)
  ) {
    mapFeatures.push({
      id: `parcel-${parcel.id}`,
      geometry: parcel.geometry as Record<string, unknown>,
      color: "#16a34a",
      fillColor: "#22c55e",
      fillOpacity: 0.3,
      weight: 2.5,
      popup: `<strong>${parcel.cadastralRef}</strong><br/>${parcel.surface.toLocaleString("es-ES")} m²${parcel.landUse ? `<br/>${parcel.landUse}` : ""}`,
    })
  }

  // Proyectos vinculados — azul, difuminado
  for (const pp of parcelProjects) {
    if (
      pp.project.geometry &&
      typeof pp.project.geometry === "object" &&
      !Array.isArray(pp.project.geometry)
    ) {
      mapFeatures.push({
        id: `project-${pp.project.id}`,
        geometry: pp.project.geometry as Record<string, unknown>,
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
        popup: `<strong>${pp.project.name}</strong><br/>Recinto del proyecto`,
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/parcels">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Parcelas
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {parcel.cadastralRef}
          </h1>
          <p className="text-sm text-muted-foreground">
            Polígono {parcel.polygon} · Parcela {parcel.parcelNumber}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/parcels/${id}/edit`}>Editar</Link>
          </Button>
          <DeleteParcelButton id={id} redirectAfter />
        </div>
      </div>

      {/* Datos catastrales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos catastrales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0">
              Ref. catastral
            </span>
            <span className="font-mono font-medium">{parcel.cadastralRef}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0">
              Polígono
            </span>
            <span className="font-medium">{parcel.polygon}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0">
              Núm. de parcela
            </span>
            <span className="font-medium">{parcel.parcelNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0">
              Superficie
            </span>
            <span className="font-medium">
              {parcel.surface.toLocaleString("es-ES")} m²
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0">
              Uso del suelo
            </span>
            <span className="font-medium">{parcel.landUse ?? "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-36 shrink-0">
              Creada
            </span>
            <span>
              {parcel.createdAt.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Geometría + Mapa */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Geometría</CardTitle>
            <CardDescription>
              Límites de la parcela en formato GeoJSON
              {geometryType && (
                <>
                  {" · "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono font-medium">
                    {geometryType}
                  </code>
                </>
              )}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/parcels/${id}/edit`}>
              {geometryString ? "Editar geometría" : "Añadir geometría"}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {mapFeatures.length > 0 ? (
            <>
              <GeoMapLoader features={mapFeatures} height={300} />
              {/* GeoJSON colapsable */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 inline-block transition-transform">▶</span>
                  Ver GeoJSON
                </summary>
                <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed max-h-52">
                  {geometryString}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sin geometría definida. Añade coordenadas para visualizar la parcela en el mapa.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sección reservada: Propietarios */}
      <Card>
        <CardHeader>
          <CardTitle>Propietarios</CardTitle>
          <CardDescription>
            Propietarios catastrales de esta parcela
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La vinculación con propietarios estará disponible próximamente.
          </p>
        </CardContent>
      </Card>

      {/* Proyectos vinculados */}
      <Card>
        <CardHeader>
          <CardTitle>
            Proyectos vinculados
            {parcelProjects.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({parcelProjects.length})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Proyectos de energía renovable que afectan a esta parcela
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parcelProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta parcela no está asignada a ningún proyecto.
            </p>
          ) : (
            <div className="space-y-2">
              {parcelProjects.map((pp) => (
                <div
                  key={pp.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/projects/${pp.project.id}`}
                      className="text-sm font-medium text-primary hover:underline underline-offset-4"
                    >
                      {pp.project.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {pp.project.powerMW} MW
                    </span>
                  </div>
                  <ProjectStatusBadge status={pp.project.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contratos */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>
              Contratos
              {parcelContracts.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({parcelContracts.length})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Contratos de arrendamiento o compraventa sobre esta parcela
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/contracts/new?parcelId=${id}`}>Nuevo contrato</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {parcelContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin contratos asociados.{" "}
              <Link
                href={`/contracts/new?parcelId=${id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Crear contrato
              </Link>
            </p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
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
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Firmado
                    </th>
                    <th className="py-2 px-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {parcelContracts.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
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
                      <td className="py-2 px-3 text-muted-foreground">
                        {c.signedAt
                          ? c.signedAt.toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
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
