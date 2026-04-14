import Link from "next/link"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getContracts } from "@/services/contract.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ContractsTable } from "@/components/contracts/contracts-table"
import {
  CONTRACT_TYPES,
  CONTRACT_STATUSES,
  TYPE_LABELS,
  STATUS_LABELS,
  type ContractType,
  type ContractStatus,
} from "@/lib/validations/contract"
import { Plus } from "lucide-react"

type Props = {
  searchParams: Promise<{ type?: string; status?: string }>
}

export default async function ContractsPage({ searchParams }: Props) {
  const { type: typeParam, status: statusParam } = await searchParams

  const type =
    typeParam && (CONTRACT_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as ContractType)
      : undefined
  const status =
    statusParam && (CONTRACT_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as ContractStatus)
      : undefined

  const user = await requireUser()
  const ctx = createAuthContext(user)
  const contracts = await getContracts(ctx, { type, status })

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Contratos de arrendamiento y compraventa
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/contracts/new">
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo contrato
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <form method="GET" className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Tipo
              </label>
              <select
                name="type"
                defaultValue={type ?? ""}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los tipos</option>
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Estado
              </label>
              <select
                name="status"
                defaultValue={status ?? ""}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos los estados</option>
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline" size="sm">
              Filtrar
            </Button>
            {(type || status) && (
              <Button asChild variant="ghost" size="sm">
                <Link href="/contracts">Limpiar</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>
            Listado
            {contracts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({contracts.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContractsTable
            contracts={contracts}
            emptyWithFilters={!!(type || status)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
