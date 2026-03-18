import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getOwnerById } from "@/services/owner.service"
import { OwnerForm } from "@/components/owners/owner-form"
import { updateOwnerAction } from "@/actions/owner"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditOwnerPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const owner = await getOwnerById(ctx, id)

  const boundAction = updateOwnerAction.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar propietario</h1>
        <p className="text-muted-foreground">{owner.name}</p>
      </div>

      <OwnerForm
        action={boundAction}
        defaultValues={owner}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
