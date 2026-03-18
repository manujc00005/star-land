import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getParcels } from "@/services/parcel.service"
import { getOwners } from "@/services/owner.service"
import { Button } from "@/components/ui/button"
import { ContractForm } from "@/components/contracts/contract-form"
import { createContractAction } from "@/actions/contract"
import { ArrowLeft } from "lucide-react"
import type { ContractType } from "@/lib/validations/contract"
import { CONTRACT_TYPES } from "@/lib/validations/contract"

type Props = {
  searchParams: Promise<{ parcelId?: string }>
}

export default async function NewContractPage({ searchParams }: Props) {
  const { parcelId: preselectedParcelId } = await searchParams

  const user = await requireUser()
  const ctx = createAuthContext(user)
  const [parcels, owners] = await Promise.all([
    getParcels(ctx),
    getOwners(ctx),
  ])

  // Preseleccionar parcela si viene por query param
  const defaultParcelId =
    preselectedParcelId &&
    parcels.some((p) => p.id === preselectedParcelId)
      ? preselectedParcelId
      : undefined

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/contracts">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Contratos
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo contrato</h1>
      </div>

      <ContractForm
        action={createContractAction}
        parcels={parcels}
        owners={owners}
        defaultValues={{ parcelId: defaultParcelId }}
        submitLabel="Crear contrato"
      />
    </div>
  )
}
