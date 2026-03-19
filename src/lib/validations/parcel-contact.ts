import { z } from "zod"

// Catálogo de roles de contacto. Texto libre en BD — este array es solo UI.
// Añadir roles aquí sin necesidad de migration.
export const CONTACT_ROLES = [
  "API",                   // Agente de Propiedad Inmobiliaria
  "Interlocutor familiar",
  "Agricultor",
  "Abogado / Gestor",
  "Otro",
] as const

export type ContactRole = (typeof CONTACT_ROLES)[number]

export const parcelContactSchema = z.object({
  name:  z.string().min(1, "El nombre es obligatorio").max(200),
  role:  z.string().min(1, "Selecciona un rol"),
  phone: z.preprocess((v) => (!v || v === "" ? undefined : v), z.string().optional()),
  email: z.preprocess((v) => (!v || v === "" ? undefined : v), z.string().email("Email inválido").optional()),
  notes: z.preprocess((v) => (!v || v === "" ? undefined : v), z.string().optional()),
})

export type ParcelContactInput = z.infer<typeof parcelContactSchema>
