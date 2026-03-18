import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"

export default function OwnersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Propietarios</h1>
          <p className="text-muted-foreground">
            Registra y gestiona los propietarios de parcelas
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo propietario
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Módulo de propietarios · Fase 2
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
