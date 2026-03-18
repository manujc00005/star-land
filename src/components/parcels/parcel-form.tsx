"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ParcelActionState } from "@/actions/parcel"

const GEOMETRY_PLACEHOLDER = `{
  "type": "Polygon",
  "coordinates": [
    [
      [longitud, latitud],
      [longitud, latitud],
      [longitud, latitud],
      [longitud, latitud]
    ]
  ]
}`

type DefaultValues = {
  cadastralRef?: string
  polygon?: string
  parcelNumber?: string
  surface?: number
  landUse?: string | null
  geometry?: string | null // JSON serializado para el textarea
}

type Props = {
  action: (
    prevState: ParcelActionState,
    formData: FormData
  ) => Promise<ParcelActionState>
  defaultValues?: DefaultValues
  submitLabel?: string
}

export function ParcelForm({
  action,
  defaultValues,
  submitLabel = "Guardar",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="cadastralRef">Referencia catastral *</Label>
        <Input
          id="cadastralRef"
          name="cadastralRef"
          defaultValue={defaultValues?.cadastralRef ?? ""}
          placeholder="14001A00200001"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="polygon">Polígono *</Label>
          <Input
            id="polygon"
            name="polygon"
            defaultValue={defaultValues?.polygon ?? ""}
            placeholder="001"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="parcelNumber">Número de parcela *</Label>
          <Input
            id="parcelNumber"
            name="parcelNumber"
            defaultValue={defaultValues?.parcelNumber ?? ""}
            placeholder="0023"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="surface">Superficie (m²) *</Label>
          <Input
            id="surface"
            name="surface"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={defaultValues?.surface ?? ""}
            placeholder="12500"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="landUse">Uso del suelo</Label>
          <Input
            id="landUse"
            name="landUse"
            defaultValue={defaultValues?.landUse ?? ""}
            placeholder="Tierra de labor secano"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="geometry">Geometría GeoJSON</Label>
        <p className="text-xs text-muted-foreground">
          Opcional. Pega un <code className="font-mono">Polygon</code> o{" "}
          <code className="font-mono">MultiPolygon</code> en formato GeoJSON.
          Coordenadas en <code className="font-mono">[longitud, latitud]</code> (WGS84).
        </p>
        <Textarea
          id="geometry"
          name="geometry"
          rows={10}
          className="font-mono text-xs resize-y"
          defaultValue={defaultValues?.geometry ?? ""}
          placeholder={GEOMETRY_PLACEHOLDER}
          spellCheck={false}
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
