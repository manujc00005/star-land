import { z } from "zod"

// Espejo del enum Prisma — fuente única de verdad para validación y UI
export const PROJECT_STATUSES = ["PLANNING", "CONSTRUCTION", "OPERATIVE"] as const
export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planificación",
  CONSTRUCTION: "Construcción",
  OPERATIVE: "Operativo",
}

export const projectSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  // coerce convierte el string del formulario a número automáticamente
  powerMW: z.coerce
    .number()
    .positive("La potencia debe ser mayor que 0"),
  status: z.enum(PROJECT_STATUSES, { error: "Estado no válido" }),
})

export type ProjectInput = z.infer<typeof projectSchema>
