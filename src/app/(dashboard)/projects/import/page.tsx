import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ImportWizard } from "@/components/projects/import/import-wizard"

export default function ImportProjectPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" asChild className="h-7 px-2">
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Importar proyecto</h1>
          </div>
          <p className="text-muted-foreground ml-9">
            Crea un proyecto a partir de un archivo Excel o CSV con sus parcelas y propietarios
          </p>
        </div>
      </div>

      <ImportWizard />
    </div>
  )
}
