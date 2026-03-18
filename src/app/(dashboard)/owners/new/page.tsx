import { requireUser } from "@/lib/session"
import { OwnerForm } from "@/components/owners/owner-form"
import { createOwnerAction } from "@/actions/owner"

export default async function NewOwnerPage() {
  await requireUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo propietario</h1>
        <p className="text-muted-foreground">
          Añade un propietario a tu organización
        </p>
      </div>

      <OwnerForm action={createOwnerAction} submitLabel="Crear propietario" />
    </div>
  )
}
