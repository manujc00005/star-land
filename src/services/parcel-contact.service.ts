import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import type { ParcelContactInput } from "@/lib/validations/parcel-contact"

/**
 * Servicio de contactos de parcela.
 * ParcelContact es una persona de gestión operativa (API, familiar, agricultor…),
 * semánticamente distinta del Owner catastral que firma contratos.
 */

export async function getContactsByParcelIds(
  ctx: AuthContext,
  parcelIds: string[]
) {
  if (parcelIds.length === 0) return []
  return db.parcelContact.findMany({
    where: { organizationId: ctx.organizationId, parcelId: { in: parcelIds } },
    orderBy: { createdAt: "asc" },
  })
}

export async function createParcelContact(
  ctx: AuthContext,
  parcelId: string,
  data: ParcelContactInput
) {
  // Verificar que la parcela pertenece a la org
  const parcel = await db.parcel.findFirst({
    where: { id: parcelId, organizationId: ctx.organizationId },
  })
  if (!parcel) notFound()

  return db.parcelContact.create({
    data: {
      name:           data.name,
      role:           data.role,
      phone:          data.phone ?? null,
      email:          data.email ?? null,
      notes:          data.notes ?? null,
      parcelId,
      organizationId: ctx.organizationId,
    },
  })
}

export async function deleteParcelContact(ctx: AuthContext, contactId: string) {
  const contact = await db.parcelContact.findFirst({
    where: { id: contactId, organizationId: ctx.organizationId },
  })
  if (!contact) notFound()
  return db.parcelContact.delete({ where: { id: contactId } })
}
