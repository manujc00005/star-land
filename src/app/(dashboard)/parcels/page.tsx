import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getParcels } from "@/services/parcel.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteParcelButton } from "@/components/parcels/delete-parcel-button"
import { MapPin, Plus, Upload } from "lucide-react"

export default async function ParcelsPage() {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const parcels = await getParcels(ctx)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parcelas</h1>
          <p className="text-muted-foreground">
            Gestiona las parcelas catastrales de tu organización
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/parcels/import">
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/parcels/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva parcela
            </Link>
          </Button>
        </div>
      </div>

      {parcels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <MapPin className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay parcelas registradas. Crea la primera o importa desde CSV.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/parcels/import">Importar CSV</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/parcels/new">Crear parcela</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-3 px-4 text-left font-medium">
                    Ref. catastral
                  </th>
                  <th className="py-3 px-4 text-left font-medium hidden sm:table-cell">
                    Pol. / Parcela
                  </th>
                  <th className="py-3 px-4 text-left font-medium">
                    Superficie
                  </th>
                  <th className="py-3 px-4 text-left font-medium hidden md:table-cell">
                    Uso del suelo
                  </th>
                  <th className="py-3 px-4 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {parcels.map((parcel) => (
                  <tr
                    key={parcel.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/parcels/${parcel.id}`}
                        className="font-mono text-xs font-medium hover:underline"
                      >
                        {parcel.cadastralRef}
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground font-mono text-xs">
                      {parcel.polygon} / {parcel.parcelNumber}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {parcel.surface.toLocaleString("es-ES")} m²
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {parcel.landUse ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/parcels/${parcel.id}/edit`}>Editar</Link>
                      </Button>
                      <DeleteParcelButton id={parcel.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
