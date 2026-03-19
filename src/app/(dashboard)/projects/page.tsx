import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjects } from "@/services/project.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FolderKanban, Plus } from "lucide-react"
import { ProjectsTable } from "@/components/projects/projects-table"

export default async function ProjectsPage() {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const projects = await getProjects(ctx)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground">
            Gestiona tus proyectos de energías renovables
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proyecto
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay proyectos registrados. Crea el primero.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects/new">Crear proyecto</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProjectsTable projects={projects} />
      )}
    </div>
  )
}
