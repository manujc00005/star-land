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
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { ContractTypeBadge } from "@/components/contracts/contract-type-badge"
import {
  CONTRACT_TYPES,
  CONTRACT_STATUSES,
  TYPE_LABELS,
  STATUS_LABELS,
  type ContractType,
  type ContractStatus,
} from "@/lib/validations/contract"
import { Plus, FileText } from "lucide-react"

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
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {type || status
                  ? "No hay contratos con los filtros seleccionados."
                  : "Todavía no hay contratos. Crea el primero."}
              </p>
              {!type && !status && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/contracts/new">Nuevo contrato</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Tipo
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Parcela
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Propietario
                    </th>
                    <th className="py-2 px-3 text-right font-medium text-muted-foreground">
                      Precio
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-muted-foreground">
                      Firmado
                    </th>
                    <th className="py-2 px-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="py-2 px-3">
                        <ContractTypeBadge type={c.type} />
                      </td>
                      <td className="py-2 px-3">
                        <ContractStatusBadge status={c.status} />
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        <Link
                          href={`/parcels/${c.parcel.id}`}
                          className="text-primary hover:underline underline-offset-4"
                        >
                          {c.parcel.cadastralRef}
                        </Link>
                      </td>
                      <td className="py-2 px-3">
                        <Link
                          href={`/owners/${c.owner.id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {c.owner.name}
                        </Link>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                        {c.price != null
                          ? `${c.price.toLocaleString("es-ES")} €`
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">
                        {c.signedAt
                          ? c.signedAt.toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/contracts/${c.id}`}>Ver</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
