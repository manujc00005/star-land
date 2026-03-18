import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, MapPin, Users, FileText } from "lucide-react"

const statsCards = [
  {
    title: "Proyectos",
    value: "—",
    icon: FolderKanban,
    description: "Proyectos activos",
  },
  {
    title: "Parcelas",
    value: "—",
    icon: MapPin,
    description: "Parcelas registradas",
  },
  {
    title: "Propietarios",
    value: "—",
    icon: Users,
    description: "Propietarios en base de datos",
  },
  {
    title: "Contratos",
    value: "—",
    icon: FileText,
    description: "Contratos gestionados",
  },
]

export default async function DashboardPage() {
  const session = await auth()
  const firstName = session?.user?.name?.split(" ")[0] ?? "Usuario"

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Resumen de actividad de tu organización
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
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

      {/* Actividad reciente */}
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
