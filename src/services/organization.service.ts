import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"

/**
 * Servicio de organización.
 *
 * PATRÓN DE TODOS LOS SERVICIOS FUTUROS:
 * 1. Reciben AuthContext como primer argumento
 * 2. Siempre filtran por ctx.organizationId
 * 3. Nunca aceptan organizationId como parámetro externo
 * 4. Usan select explícito para no exponer campos sensibles
 *
 * Así se construirán: ProjectService, ParcelService, OwnerService, etc.
 */

/**
 * Obtiene los datos de la organización del usuario autenticado.
 */
export async function getOrganizationById(ctx: AuthContext) {
  return db.organization.findUnique({
    where: { id: ctx.organizationId },
  })
}

/**
 * Obtiene los miembros de la organización.
 * select explícito: nunca exponer passwordHash.
 */
export async function getOrganizationMembers(ctx: AuthContext) {
  return db.user.findMany({
    where: { organizationId: ctx.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })
}
