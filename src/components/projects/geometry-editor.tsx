"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProjectActionState } from "@/actions/project"

const EXAMPLE_GEOJSON = `{
  "type": "Polygon",
  "coordinates": [
    [
      [-3.7038, 40.4168],
      [-3.7010, 40.4168],
      [-3.7010, 40.4140],
      [-3.7038, 40.4140],
      [-3.7038, 40.4168]
    ]
  ]
}`

type Props = {
  /** Server Action ya vinculada al id del proyecto via .bind(null, id) */
  action: (
    prevState: ProjectActionState,
    formData: FormData
  ) => Promise<ProjectActionState>
  /** Geometría actual serializada como JSON bonito, o null si no existe */
  currentGeometry: string | null
}

/**
 * Editor de geometría GeoJSON.
 *
 * Diseñado para convivir con una futura UI visual (mapa + dibujado):
 * - La lógica de validación vive en el servidor (action + geojson.ts)
 * - Este componente solo muestra/edita el texto — reemplazable por un mapa
 * - Textarea vacío = eliminar geometría
 */
export function GeometryEditor({ action, currentGeometry }: Props) {
  const [state, formAction, isPending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="geometry">GeoJSON del recinto</Label>
        <p className="text-xs text-muted-foreground">
          Pega un <code className="font-mono">Polygon</code> o{" "}
          <code className="font-mono">MultiPolygon</code> en formato GeoJSON.
          Deja vacío para eliminar la geometría.
        </p>
        <Textarea
          id="geometry"
          name="geometry"
          rows={14}
          className="font-mono text-xs resize-y"
          defaultValue={currentGeometry ?? ""}
          placeholder={EXAMPLE_GEOJSON}
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Coordenadas en formato{" "}
          <code className="font-mono">[longitud, latitud]</code> (WGS84).
        </p>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar geometría"}
      </Button>
    </form>
  )
}
