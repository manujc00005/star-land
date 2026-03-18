import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      {/* Info de sesión actual — útil para depuración en Fase 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32">Nombre</span>
            <span className="font-medium">{session?.user?.name ?? "—"}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32">Email</span>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32">Organización ID</span>
            <span className="font-mono text-xs text-muted-foreground">
              {session?.user?.organizationId}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
          <Settings className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Más opciones de configuración · Fase 2
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
