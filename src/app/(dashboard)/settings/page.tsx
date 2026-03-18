import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import {
  getOrganizationById,
  getOrganizationMembers,
} from "@/services/organization.service"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function SettingsPage() {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  // Ejemplo del patrón multi-tenancy: ambas queries filtran por organizationId
  const [org, members] = await Promise.all([
    getOrganizationById(ctx),
    getOrganizationMembers(ctx),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Gestiona tu cuenta y organización</p>
      </div>

      {/* Organización */}
      <Card>
        <CardHeader>
          <CardTitle>Organización</CardTitle>
          <CardDescription>Datos de tu organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Nombre</span>
            <span className="font-medium">{org?.name ?? "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">ID</span>
            <span className="font-mono text-xs text-muted-foreground break-all">
              {org?.id}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cuenta */}
      <Card>
        <CardHeader>
          <CardTitle>Tu cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Nombre</span>
            <span className="font-medium">{user.name ?? "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24 shrink-0">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Miembros */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros ({members.length})</CardTitle>
          <CardDescription>Usuarios en tu organización</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                  {(m.name ?? m.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.name ?? "Sin nombre"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
