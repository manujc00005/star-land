import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getOrganizationById } from "@/services/organization.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, MapPin, Users, FileText } from "lucide-react"

const statsCards = [
  { title: "Proyectos", value: "—", icon: FolderKanban, description: "Proyectos activos" },
  { title: "Parcelas", value: "—", icon: MapPin, description: "Parcelas registradas" },
  { title: "Propietarios", value: "—", icon: Users, description: "Propietarios en base de datos" },
  { title: "Contratos", value: "—", icon: FileText, description: "Contratos gestionados" },
]

export default async function DashboardPage() {
  // requireUser() redirige a /login si no hay sesión — garantía de auth
  const user = await requireUser()
  const ctx = createAuthContext(user)

  // Todos los datos se obtienen a través del servicio con ctx (organizationId)
  const org = await getOrganizationById(ctx)

  const firstName = user.name?.split(" ")[0] ?? "Usuario"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {firstName}
        </h1>
        <p className="text-muted-foreground">
          {org?.name} · Resumen de actividad
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map(({ title, value, icon: Icon, description }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay actividad reciente. Empieza creando un proyecto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
