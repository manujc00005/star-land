"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CONTRACT_TYPES,
  CONTRACT_STATUSES,
  TYPE_LABELS,
  STATUS_LABELS,
  type ContractType,
  type ContractStatus,
} from "@/lib/validations/contract"
import type { ContractActionState } from "@/actions/contract"

type SelectParcel = { id: string; cadastralRef: string; polygon: string }
type SelectOwner = { id: string; name: string; nif: string }

type DefaultValues = {
  type?: ContractType
  status?: ContractStatus
  price?: number | null
  signedAt?: Date | null
  parcelId?: string
  ownerId?: string
}

type Props = {
  action: (prev: ContractActionState, formData: FormData) => Promise<ContractActionState>
  parcels: SelectParcel[]
  owners: SelectOwner[]
  defaultValues?: DefaultValues
  submitLabel?: string
}

export function ContractForm({
  action,
  parcels,
  owners,
  defaultValues,
  submitLabel = "Guardar contrato",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, null)

  const defaultSignedAt = defaultValues?.signedAt
    ? defaultValues.signedAt.toISOString().slice(0, 10)
    : ""

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label htmlFor="type">Tipo de contrato</Label>
        <select
          id="type"
          name="type"
          defaultValue={defaultValues?.type ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>
            Selecciona un tipo…
          </option>
          {CONTRACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div className="space-y-1.5">
        <Label htmlFor="status">Estado</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "DRAFT"}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Parcela */}
      <div className="space-y-1.5">
        <Label htmlFor="parcelId">Parcela</Label>
        <select
          id="parcelId"
          name="parcelId"
          defaultValue={defaultValues?.parcelId ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>
            Selecciona una parcela…
          </option>
          {parcels.map((p) => (
            <option key={p.id} value={p.id}>
              {p.cadastralRef} · Pol. {p.polygon}
            </option>
          ))}
        </select>
        {parcels.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay parcelas disponibles. Crea una parcela antes de crear un contrato.
          </p>
        )}
      </div>

      {/* Propietario */}
      <div className="space-y-1.5">
        <Label htmlFor="ownerId">Propietario</Label>
        <select
          id="ownerId"
          name="ownerId"
          defaultValue={defaultValues?.ownerId ?? ""}
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="" disabled>
            Selecciona un propietario…
          </option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.nif}
            </option>
          ))}
        </select>
        {owners.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay propietarios disponibles. Crea un propietario antes de crear un contrato.
          </p>
        )}
      </div>

      {/* Precio */}
      <div className="space-y-1.5">
        <Label htmlFor="price">
          Precio{" "}
          <span className="text-muted-foreground font-normal">(€ · opcional)</span>
        </Label>
        <Input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          defaultValue={defaultValues?.price ?? ""}
        />
      </div>

      {/* Fecha de firma */}
      <div className="space-y-1.5">
        <Label htmlFor="signedAt">
          Fecha de firma{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="signedAt"
          name="signedAt"
          type="date"
          defaultValue={defaultSignedAt}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Guardando…" : submitLabel}
      </Button>
    </form>
  )
}
