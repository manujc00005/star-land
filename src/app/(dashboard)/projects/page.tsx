import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjects } from "@/services/project.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { DeleteProjectButton } from "@/components/projects/delete-project-button"
import { FolderKanban, Plus } from "lucide-react"

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
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-3 px-4 text-left font-medium">Nombre</th>
                  <th className="py-3 px-4 text-left font-medium">Potencia</th>
                  <th className="py-3 px-4 text-left font-medium">Estado</th>
                  <th className="py-3 px-4 text-left font-medium hidden md:table-cell">
                    Creado
                  </th>
                  <th className="py-3 px-4 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {project.powerMW} MW
                    </td>
                    <td className="py-3 px-4">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {project.createdAt.toLocaleDateString("es-ES")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/projects/${project.id}/edit`}>
                          Editar
                        </Link>
                      </Button>
                      <DeleteProjectButton id={project.id} />
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
