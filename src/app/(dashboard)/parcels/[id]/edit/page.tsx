import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getParcelById } from "@/services/parcel.service"
import { ParcelForm } from "@/components/parcels/parcel-form"
import { updateParcelAction } from "@/actions/parcel"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditParcelPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const parcel = await getParcelById(ctx, id)

  const boundAction = updateParcelAction.bind(null, id)

  // Serializar geometry para el textarea
  const geometryString = parcel.geometry
    ? JSON.stringify(parcel.geometry, null, 2)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar parcela</h1>
        <p className="text-muted-foreground font-mono text-sm">
          {parcel.cadastralRef}
        </p>
      </div>

      <ParcelForm
        action={boundAction}
        defaultValues={{
          cadastralRef: parcel.cadastralRef,
          polygon: parcel.polygon,
          parcelNumber: parcel.parcelNumber,
          surface: parcel.surface,
          landUse: parcel.landUse,
          geometry: geometryString,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
