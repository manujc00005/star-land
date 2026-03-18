import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getContractById } from "@/services/contract.service"
import { getParcels } from "@/services/parcel.service"
import { getOwners } from "@/services/owner.service"
import { Button } from "@/components/ui/button"
import { ContractForm } from "@/components/contracts/contract-form"
import { updateContractAction } from "@/actions/contract"
import { ArrowLeft } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditContractPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const [contract, parcels, owners] = await Promise.all([
    getContractById(ctx, id),
    getParcels(ctx),
    getOwners(ctx),
  ])

  const boundAction = updateContractAction.bind(null, id)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/contracts/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al contrato
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Editar contrato</h1>
      </div>

      <ContractForm
        action={boundAction}
        parcels={parcels}
        owners={owners}
        defaultValues={{
          type: contract.type,
          status: contract.status,
          price: contract.price,
          signedAt: contract.signedAt,
          parcelId: contract.parcelId,
          ownerId: contract.ownerId,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  )
}
