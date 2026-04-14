"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ContractStatusBadge } from "@/components/contracts/contract-status-badge"
import { ContractTypeBadge } from "@/components/contracts/contract-type-badge"
import { X, ExternalLink, FileText } from "lucide-react"
import type { ContractType, ContractStatus } from "@/lib/validations/contract"

export type ContractRow = {
  id: string
  type: ContractType
  status: ContractStatus
  price: number | null
  signedAt: Date | null
  nextStep: string | null
  nextStepDate: Date | null
  notes: string | null
  createdAt: Date
  parcel: {
    id: string
    cadastralRef: string
    polygon: string
    parcelNumber: string
    surface: number
    municipality: string | null
  }
  owner: {
    id: string
    name: string
    nif: string
    email: string | null
    phone: string | null
  }
}

type Props = {
  contracts: ContractRow[]
  emptyWithFilters: boolean
}

function fmtShort(date: Date | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function fmtLong(date: Date | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-28 shrink-0 text-xs">{label}</span>
      <span className="font-medium text-sm">{children}</span>
    </div>
  )
}

export function ContractsTable({ contracts, emptyWithFilters }: Props) {
  const [selected, setSelected] = useState<ContractRow | null>(null)

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {emptyWithFilters
            ? "No hay contratos con los filtros seleccionados."
            : "Todavía no hay contratos. Crea el primero."}
        </p>
        {!emptyWithFilters && (
          <Button asChild size="sm" variant="outline">
            <Link href="/contracts/new">Nuevo contrato</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Parcela</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground hidden md:table-cell">Propietario</th>
              <th className="py-2 px-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Precio</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Firmado</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr
                key={c.id}
                className={[
                  "border-b last:border-0 cursor-pointer transition-colors",
                  selected?.id === c.id ? "bg-primary/5" : "hover:bg-muted/20",
                ].join(" ")}
                onClick={() => setSelected((prev) => (prev?.id === c.id ? null : c))}
              >
                <td className="py-2 px-3"><ContractTypeBadge type={c.type} /></td>
                <td className="py-2 px-3"><ContractStatusBadge status={c.status} /></td>
                <td className="py-2 px-3 font-mono text-xs">{c.parcel.cadastralRef}</td>
                <td className="py-2 px-3 hidden md:table-cell">{c.owner.name}</td>
                <td className="py-2 px-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                  {c.price != null ? `${c.price.toLocaleString("es-ES")} €` : "—"}
                </td>
                <td className="py-2 px-3 text-muted-foreground hidden lg:table-cell">
                  {fmtShort(c.signedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setSelected(null)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-background border-l shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div className="flex items-center gap-2 flex-wrap">
                <ContractTypeBadge type={selected.type} />
                <ContractStatusBadge status={selected.status} />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="sm" title="Ver página completa">
                  <Link href={`/contracts/${selected.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
              {/* Contrato */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contrato
                </h3>
                <Row label="Precio">
                  {selected.price != null
                    ? `${selected.price.toLocaleString("es-ES")} €`
                    : "—"}
                </Row>
                <Row label="Fecha firma">{fmtLong(selected.signedAt)}</Row>
                {selected.nextStep && (
                  <Row label="Next step">
                    <span>{selected.nextStep}</span>
                    {selected.nextStepDate && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                        {fmtShort(selected.nextStepDate)}
                      </span>
                    )}
                  </Row>
                )}
                {selected.notes && (
                  <Row label="Notas">
                    <span className="font-normal text-muted-foreground">{selected.notes}</span>
                  </Row>
                )}
                <Row label="Creado">{fmtLong(selected.createdAt)}</Row>
              </section>

              {/* Parcela */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Parcela
                </h3>
                <Row label="Ref. catastral">
                  <Link
                    href={`/parcels/${selected.parcel.id}`}
                    className="font-mono text-primary hover:underline underline-offset-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selected.parcel.cadastralRef}
                  </Link>
                </Row>
                <Row label="Polígono">{selected.parcel.polygon}</Row>
                <Row label="Núm. parcela">{selected.parcel.parcelNumber}</Row>
                <Row label="Superficie">
                  {selected.parcel.surface.toLocaleString("es-ES")} ha
                </Row>
                {selected.parcel.municipality && (
                  <Row label="Municipio">{selected.parcel.municipality}</Row>
                )}
              </section>

              {/* Propietario */}
              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Propietario
                </h3>
                <Row label="Nombre">
                  <Link
                    href={`/owners/${selected.owner.id}`}
                    className="text-primary hover:underline underline-offset-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selected.owner.name}
                  </Link>
                </Row>
                <Row label="NIF">
                  <span className="font-mono">{selected.owner.nif}</span>
                </Row>
                {selected.owner.email && (
                  <Row label="Email">{selected.owner.email}</Row>
                )}
                {selected.owner.phone && (
                  <Row label="Teléfono">{selected.owner.phone}</Row>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/contracts/${selected.id}/edit`}>Editar</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/contracts/${selected.id}`}>Ver completo</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
