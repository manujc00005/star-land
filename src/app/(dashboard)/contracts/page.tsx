import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Gestiona los contratos de arrendamiento y servidumbre
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo contrato
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Módulo de contratos · Fase 2
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
