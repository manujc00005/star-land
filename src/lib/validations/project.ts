import { z } from "zod"

// ── Estado ─────────────────────────────────────────────────────────────────────
export const PROJECT_STATUSES = [
  "OPPORTUNITY",
  "IN_DEVELOPMENT",
  "RTB",
  "IN_CONSTRUCTION",
  "IN_OPERATION",
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  OPPORTUNITY:     "Oportunidad",
  IN_DEVELOPMENT:  "En Desarrollo",
  RTB:             "Ready to Build",
  IN_CONSTRUCTION: "En Construcción",
  IN_OPERATION:    "En Operación",
}

// ── Tecnologías ────────────────────────────────────────────────────────────────
// Sugerencias para el datalist del formulario. No son exhaustivas ni obligatorias.
export const TECH_SUGGESTIONS = [
  "Fotovoltaica",
  "Eólico",
  "Almacenamiento (BESS)",
  "Termosolar",
  "Hidráulica",
  "Biomasa",
  "Otro",
]

export const technologySchema = z.object({
  type: z.string().min(1, "Indica el tipo de tecnología"),
  powerMW: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().positive("La potencia debe ser mayor que 0").optional()
  ),
})

export type Technology = z.infer<typeof technologySchema>

// ── Proyecto ───────────────────────────────────────────────────────────────────
export const projectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  technologies: z
    .array(technologySchema)
    .min(1, "Al menos una tecnología es obligatoria"),
  status: z.enum(PROJECT_STATUSES, { error: "Estado no válido" }),
  // connectionPoints: array serializado como JSON en el formulario
  connectionPoints: z.array(z.string().min(1)).default([]),
  cluster:    z.preprocess((v) => (!v || v === "" ? undefined : v), z.string().optional()),
  developer:  z.preprocess((v) => (!v || v === "" ? undefined : v), z.string().optional()),
  spv:        z.preprocess((v) => (!v || v === "" ? undefined : v), z.string().optional()),
})

export type ProjectInput = z.infer<typeof projectSchema>
