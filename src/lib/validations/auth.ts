import { z } from "zod"

/**
 * Schemas centralizados de validación de autenticación.
 * Usados tanto en Server Actions como en lib/auth.ts (authorize).
 * Un solo lugar de verdad para las reglas de validación.
 */

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z.object({
  organizationName: z
    .string()
    .min(2, "El nombre de la organización debe tener al menos 2 caracteres")
    .max(100, "El nombre de la organización es demasiado largo"),
  name: z
    .string()
    .min(2, "Tu nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga"),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
