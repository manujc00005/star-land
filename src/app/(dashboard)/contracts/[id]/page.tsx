import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getContractById } from "@/services/contract.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { ContractTypeBadge } from "@/components/contracts/contract-type-badge"
import { DeleteContractButton } from "@/components/contracts/delete-contract-button"
import { ArrowLeft } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params
  const user = await requireUser()
  const ctx = createAuthContext(user)
  const contract = await getContractById(ctx, id)

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/contracts">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Contratos
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Contrato
            </h1>
            <ContractTypeBadge type={contract.type} />
            <ContractStatusBadge status={contract.status} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/contracts/${id}/edit`}>Editar</Link>
          </Button>
          <DeleteContractButton id={id} />
        </div>
      </div>

      {/* Datos del contrato */}
      <Card>
        <CardHeader>
          <CardTitle>Datos del contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">Tipo</span>
            <ContractTypeBadge type={contract.type} />
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">Estado</span>
            <ContractStatusBadge status={contract.status} />
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">Precio</span>
            <span className="font-medium">
              {contract.price != null
                ? `${contract.price.toLocaleString("es-ES")} €`
                : "—"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">
              Fecha de firma
            </span>
            <span className="font-medium">
              {contract.signedAt
                ? contract.signedAt.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">Creado</span>
            <span>
              {contract.createdAt.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Parcela */}
      <Card>
        <CardHeader>
          <CardTitle>Parcela</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">
              Ref. catastral
            </span>
            <Link
              href={`/parcels/${contract.parcel.id}`}
              className="font-mono font-medium text-primary hover:underline underline-offset-4"
            >
              {contract.parcel.cadastralRef}
            </Link>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">
              Polígono
            </span>
            <span>{contract.parcel.polygon}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">
              Núm. parcela
            </span>
            <span>{contract.parcel.parcelNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">
              Superficie
            </span>
            <span>{contract.parcel.surface.toLocaleString("es-ES")} m²</span>
          </div>
        </CardContent>
      </Card>

      {/* Propietario */}
      <Card>
        <CardHeader>
          <CardTitle>Propietario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">Nombre</span>
            <Link
              href={`/owners/${contract.owner.id}`}
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              {contract.owner.name}
            </Link>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-32 shrink-0">NIF</span>
            <span className="font-mono">{contract.owner.nif}</span>
          </div>
          {contract.owner.email && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-32 shrink-0">Email</span>
              <span>{contract.owner.email}</span>
            </div>
          )}
          {contract.owner.phone && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-32 shrink-0">
                Teléfono
              </span>
              <span>{contract.owner.phone}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
