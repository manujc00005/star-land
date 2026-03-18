import { z } from "zod"

export const ownerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  nif: z.string().min(1, "El NIF es obligatorio").max(20),
  address: z.string().max(500).optional().transform((v) => v?.trim() || null),
  phone: z.string().max(20).optional().transform((v) => v?.trim() || null),
  email: z
    .string()
    .optional()
    .transform((v) => v?.trim() || null)
    .pipe(z.string().email("Email inválido").nullable().or(z.literal(null))),
})

export type OwnerInput = z.infer<typeof ownerSchema>
