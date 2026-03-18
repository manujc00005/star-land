"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OwnerActionState } from "@/actions/owner"

type Owner = {
  name: string
  nif: string
  address: string | null
  phone: string | null
  email: string | null
}

type Props = {
  action: (prevState: OwnerActionState, formData: FormData) => Promise<OwnerActionState>
  defaultValues?: Partial<Owner>
  submitLabel?: string
}

export function OwnerForm({ action, defaultValues, submitLabel = "Guardar" }: Props) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Nombre completo o razón social"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nif">NIF / CIF *</Label>
        <Input
          id="nif"
          name="nif"
          defaultValue={defaultValues?.nif ?? ""}
          placeholder="12345678A"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          name="address"
          defaultValue={defaultValues?.address ?? ""}
          placeholder="Calle, número, localidad"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          placeholder="600 000 000"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          placeholder="propietario@ejemplo.com"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
