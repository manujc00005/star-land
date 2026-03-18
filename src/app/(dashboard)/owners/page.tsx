import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getOwners } from "@/services/owner.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteOwnerButton } from "@/components/owners/delete-owner-button"
import { Plus, Users } from "lucide-react"

export default async function OwnersPage() {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const owners = await getOwners(ctx)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propietarios</h1>
          <p className="text-muted-foreground">
            Registra y gestiona los propietarios de parcelas
          </p>
        </div>
        <Button asChild>
          <Link href="/owners/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo propietario
          </Link>
        </Button>
      </div>

      {owners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay propietarios registrados. Crea el primero.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/owners/new">Crear propietario</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-3 px-4 text-left font-medium">Nombre</th>
                  <th className="py-3 px-4 text-left font-medium">NIF</th>
                  <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Email</th>
                  <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Teléfono</th>
                  <th className="py-3 px-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{owner.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {owner.nif}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {owner.email ?? "—"}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {owner.phone ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/owners/${owner.id}/edit`}>Editar</Link>
                      </Button>
                      <DeleteOwnerButton id={owner.id} />
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
