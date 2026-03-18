"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/validations/project"
import type { ProjectActionState } from "@/actions/project"

type DefaultValues = {
  name?: string
  powerMW?: number
  status?: ProjectStatus
}

type Props = {
  action: (
    prevState: ProjectActionState,
    formData: FormData
  ) => Promise<ProjectActionState>
  defaultValues?: DefaultValues
  submitLabel?: string
}

export function ProjectForm({
  action,
  defaultValues,
  submitLabel = "Guardar",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre del proyecto *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Parque solar Sierra Norte"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="powerMW">Potencia (MW) *</Label>
        <Input
          id="powerMW"
          name="powerMW"
          type="number"
          step="0.01"
          min="0.01"
          defaultValue={defaultValues?.powerMW ?? ""}
          placeholder="50"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Estado *</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "PLANNING"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
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
