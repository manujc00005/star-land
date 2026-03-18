import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import type { OwnerInput } from "@/lib/validations/owner"

/**
 * Servicio de propietarios.
 * Sigue el patrón AuthContext: todas las queries filtran por ctx.organizationId.
 */

export async function getOwners(ctx: AuthContext) {
  return db.owner.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { name: "asc" },
  })
}

export async function getOwnerById(ctx: AuthContext, id: string) {
  const owner = await db.owner.findFirst({
    where: { id, organizationId: ctx.organizationId },
  })
  if (!owner) notFound()
  return owner
}

export async function createOwner(ctx: AuthContext, data: OwnerInput) {
  return db.owner.create({
    data: {
      ...data,
      organizationId: ctx.organizationId,
    },
  })
}

export async function updateOwner(
  ctx: AuthContext,
  id: string,
  data: OwnerInput
) {
  // Verify ownership before updating
  await getOwnerById(ctx, id)
  return db.owner.update({
    where: { id },
    data,
  })
}

export async function deleteOwner(ctx: AuthContext, id: string) {
  // Verify ownership before deleting
  await getOwnerById(ctx, id)
  return db.owner.delete({ where: { id } })
}
