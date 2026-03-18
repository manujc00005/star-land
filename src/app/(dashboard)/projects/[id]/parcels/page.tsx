import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjectById } from "@/services/project.service"
import {
  getProjectParcels,
  searchAvailableParcels,
} from "@/services/project-parcel.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RemoveParcelButton } from "@/components/projects/parcels/remove-parcel-button"
import { AssignParcelButton } from "@/components/projects/parcels/assign-parcel-button"
import { ArrowLeft, Search } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function AssignParcelsPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params
  const { q = "" } = await searchParams

  const user = await requireUser()
  const ctx = createAuthContext(user)

  const [project, projectParcels, availableParcels] = await Promise.all([
    getProjectById(ctx, id),
    getProjectParcels(ctx, id),
    searchAvailableParcels(ctx, id, q),
  ])

  const totalSurface = projectParcels.reduce(
    (sum, pp) => sum + pp.parcel.surface,
    0
  )

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {project.name}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Gestionar parcelas
        </h1>
        <p className="text-muted-foreground text-sm">
          Asigna o desvincula parcelas del proyecto{" "}
          <span className="font-medium text-foreground">{project.name}</span>
        </p>
      </div>

      {/* Parcelas asignadas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Parcelas asignadas
            {projectParcels.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({projectParcels.length})
              </span>
            )}
          </CardTitle>
          {projectParcels.length > 0 && (
            <CardDescription>
              Superficie total:{" "}
              <span className="font-medium text-foreground">
                {totalSurface.toLocaleString("es-ES")} m²
              </span>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {projectParcels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguna parcela asignada todavía.
            </p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Ref. catastral
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Polígono
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Parcela
                    </th>
                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                      Superficie
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Uso
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
                      <td className="py-2 px-3 text-muted-foreground">
                        {pp.parcel.polygon}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {pp.parcel.parcelNumber}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {pp.parcel.surface.toLocaleString("es-ES")} m²
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs max-w-36 truncate">
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

      {/* Buscador de parcelas disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Añadir parcela</CardTitle>
          <CardDescription>
            Busca por referencia catastral, número de parcela o polígono
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar parcela…"
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button type="submit" variant="outline" size="default">
              Buscar
            </Button>
          </form>

          {availableParcels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {q
                ? "No se encontraron parcelas disponibles con ese criterio."
                : "No hay parcelas disponibles para asignar."}
            </p>
          ) : (
            <>
              {!q && (
                <p className="text-xs text-muted-foreground">
                  Mostrando hasta 30 parcelas disponibles. Usa el buscador para
                  filtrar.
                </p>
              )}
              <div className="overflow-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                        Ref. catastral
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                        Polígono
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                        Parcela
                      </th>
                      <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                        Superficie
                      </th>
                      <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                        Uso
                      </th>
                      <th className="py-2 px-3 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {availableParcels.map((parcel) => (
                      <tr key={parcel.id} className="border-b last:border-0">
                        <td className="py-2 px-3 font-mono text-xs">
                          {parcel.cadastralRef}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {parcel.polygon}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {parcel.parcelNumber}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {parcel.surface.toLocaleString("es-ES")} m²
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-xs max-w-36 truncate">
                          {parcel.landUse ?? "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <AssignParcelButton
                            projectId={id}
                            parcelId={parcel.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
