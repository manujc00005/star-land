import { requireUser } from "@/lib/session"
import { ProjectForm } from "@/components/projects/project-form"
import { createProjectAction } from "@/actions/project"

export default async function NewProjectPage() {
  await requireUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo proyecto</h1>
        <p className="text-muted-foreground">
          Añade un proyecto de energía renovable a tu organización
        </p>
      </div>

      <ProjectForm action={createProjectAction} submitLabel="Crear proyecto" />
    </div>
  )
}
