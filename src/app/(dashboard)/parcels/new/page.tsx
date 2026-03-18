import { requireUser } from "@/lib/session"
import { ParcelForm } from "@/components/parcels/parcel-form"
import { createParcelAction } from "@/actions/parcel"

export default async function NewParcelPage() {
  await requireUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva parcela</h1>
        <p className="text-muted-foreground">
          Registra una parcela catastral en tu organización
        </p>
      </div>

      <ParcelForm action={createParcelAction} submitLabel="Crear parcela" />
    </div>
  )
}
