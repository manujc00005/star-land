import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjectById } from "@/services/project.service"
import { ProjectForm } from "@/components/projects/project-form"
import { updateProjectAction } from "@/actions/project"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const project = await getProjectById(ctx, id)

  const boundAction = updateProjectAction.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Editar proyecto
        </h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      <ProjectForm
        action={boundAction}
        defaultValues={project}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
