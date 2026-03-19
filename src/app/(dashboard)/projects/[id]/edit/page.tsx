import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getProjectById } from "@/services/project.service"
import { ProjectForm } from "@/components/projects/project-form"
import { updateProjectAction } from "@/actions/project"
import { technologySchema } from "@/lib/validations/project"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const project = await getProjectById(ctx, id)

  const boundAction = updateProjectAction.bind(null, id)

  // Deserializar technologies de JsonValue a Technology[] validado
  const technologies = Array.isArray(project.technologies)
    ? project.technologies.flatMap((t) => {
        const parsed = technologySchema.safeParse(t)
        return parsed.success ? [parsed.data] : []
      })
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar proyecto</h1>
        <p className="text-muted-foreground">{project.name}</p>
      </div>

      <ProjectForm
        action={boundAction}
        defaultValues={{
          name:             project.name,
          status:           project.status,
          technologies,
          connectionPoints: project.connectionPoints,
          cluster:          project.cluster,
          developer:        project.developer,
          spv:              project.spv,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
