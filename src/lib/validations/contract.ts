import { z } from "zod"

// ── Constantes y labels UI ─────────────────────────────────────────────────────

export const CONTRACT_TYPES = ["RENTAL", "PURCHASE"] as const
export type ContractType = (typeof CONTRACT_TYPES)[number]

export const TYPE_LABELS: Record<ContractType, string> = {
  RENTAL: "Arrendamiento",
  PURCHASE: "Compraventa",
}

export const CONTRACT_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "SIGNED_ADDENDUM"] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  EXPIRED: "Expirado",
  SIGNED_ADDENDUM: "Firmado - Adenda",
}

// ── Schema Zod ─────────────────────────────────────────────────────────────────

export const contractSchema = z.object({
  type: z.enum(CONTRACT_TYPES, { error: "Selecciona un tipo de contrato" }),
  status: z.enum(CONTRACT_STATUSES, { error: "Selecciona un estado" }),
  price: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce
      .number({ message: "El precio debe ser un número" })
      .min(0, "El precio debe ser mayor o igual a 0")
      .optional()
  ),
  signedAt: z.preprocess(
    (v) => (!v || v === "" ? undefined : v),
    z.coerce.date({ message: "Fecha de firma inválida" }).optional()
  ),
  parcelId: z.string().min(1, "Selecciona una parcela"),
  ownerId: z.string().min(1, "Selecciona un propietario"),
})

export type ContractInput = z.infer<typeof contractSchema>
