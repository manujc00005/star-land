"use client"

import { useActionState, useState, useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  TECH_SUGGESTIONS,
  type ProjectStatus,
  type Technology,
} from "@/lib/validations/project"
import type { ProjectActionState } from "@/actions/project"
import { Plus, X } from "lucide-react"

// ── Tipos ──────────────────────────────────────────────────────────────────────

type DefaultValues = {
  name?: string
  status?: ProjectStatus
  technologies?: Technology[]
  connectionPoints?: string[]
  cluster?: string | null
  developer?: string | null
  spv?: string | null
}

type Props = {
  action: (
    prevState: ProjectActionState,
    formData: FormData
  ) => Promise<ProjectActionState>
  defaultValues?: DefaultValues
  submitLabel?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function emptyTech(): Technology {
  return { type: "", powerMW: undefined }
}

// ── Componente principal ───────────────────────────────────────────────────────

export function ProjectForm({
  action,
  defaultValues,
  submitLabel = "Guardar",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, {})
  const datalistId = useId()

  // Lista de tecnologías — mínimo 1 entrada vacía
  const [technologies, setTechnologies] = useState<Technology[]>(
    defaultValues?.technologies?.length
      ? defaultValues.technologies
      : [emptyTech()]
  )

  // Puntos de conexión como lista de tags
  const [connectionPoints, setConnectionPoints] = useState<string[]>(
    defaultValues?.connectionPoints ?? []
  )
  const [cpInput, setCpInput] = useState("")

  // ── Handlers tecnologías ─────────────────────────────────────────────────────

  function updateTech(index: number, field: keyof Technology, value: string) {
    setTechnologies((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              [field]:
                field === "powerMW"
                  ? value === ""
                    ? undefined
                    : Number(value)
                  : value,
            }
          : t
      )
    )
  }

  function addTech() {
    setTechnologies((prev) => [...prev, emptyTech()])
  }

  function removeTech(index: number) {
    setTechnologies((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Handlers connection points ───────────────────────────────────────────────

  function addConnectionPoint() {
    const val = cpInput.trim()
    if (!val || connectionPoints.includes(val)) return
    setConnectionPoints((prev) => [...prev, val])
    setCpInput("")
  }

  function removeConnectionPoint(val: string) {
    setConnectionPoints((prev) => prev.filter((p) => p !== val))
  }

  function handleCpKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addConnectionPoint()
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form action={formAction} className="space-y-6 max-w-xl">
      {state.error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {state.error}
        </p>
      )}

      {/* Nombre */}
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

      {/* Estado */}
      <div className="space-y-1.5">
        <Label htmlFor="status">Estado *</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "OPPORTUNITY"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Tecnologías */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Tecnologías *</Label>
          <button
            type="button"
            onClick={addTech}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir tecnología
          </button>
        </div>

        <datalist id={datalistId}>
          {TECH_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="space-y-2">
          {technologies.map((tech, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Tipo (ej. Fotovoltaica)"
                value={tech.type}
                onChange={(e) => updateTech(i, "type", e.target.value)}
                list={datalistId}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="MW (opcional)"
                value={tech.powerMW ?? ""}
                onChange={(e) => updateTech(i, "powerMW", e.target.value)}
                min="0"
                step="0.01"
                className="w-32"
              />
              {technologies.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTech(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  aria-label="Eliminar tecnología"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Hidden input con technologies serializadas */}
        <input
          type="hidden"
          name="technologies"
          value={JSON.stringify(technologies)}
        />
      </div>

      {/* Puntos de conexión */}
      <div className="space-y-1.5">
        <Label>Puntos de acceso y conexión</Label>
        <div className="flex gap-2">
          <Input
            value={cpInput}
            onChange={(e) => setCpInput(e.target.value)}
            onKeyDown={handleCpKeyDown}
            onBlur={addConnectionPoint}
            placeholder="Escribe y pulsa Enter"
            className="flex-1"
          />
        </div>
        {connectionPoints.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {connectionPoints.map((cp) => (
              <span
                key={cp}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
              >
                {cp}
                <button
                  type="button"
                  onClick={() => removeConnectionPoint(cp)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Eliminar ${cp}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Hidden input con connectionPoints serializados */}
        <input
          type="hidden"
          name="connectionPoints"
          value={JSON.stringify(connectionPoints)}
        />
      </div>

      {/* Campos relacionales opcionales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cluster">Cluster</Label>
          <Input
            id="cluster"
            name="cluster"
            defaultValue={defaultValues?.cluster ?? ""}
            placeholder="Ej. Sur peninsular"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="developer">Desarrollador</Label>
          <Input
            id="developer"
            name="developer"
            defaultValue={defaultValues?.developer ?? ""}
            placeholder="Ej. Iberdrola"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spv">SPV Asignada</Label>
          <Input
            id="spv"
            name="spv"
            defaultValue={defaultValues?.spv ?? ""}
            placeholder="Ej. Solar Sur SL"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => history.back()}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
