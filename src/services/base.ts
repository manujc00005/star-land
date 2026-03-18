import type { AuthUser } from "@/lib/session"

/**
 * Contexto de autenticación que se pasa a todos los servicios de negocio.
 *
 * REGLA FUNDAMENTAL DE MULTI-TENANCY:
 * - organizationId NUNCA viene del cliente (body, params, cookies del cliente).
 * - organizationId SIEMPRE se extrae de la sesión JWT del servidor.
 * - Todos los servicios reciben AuthContext y filtran por organizationId.
 *
 * @example
 * // En un Server Component o Server Action:
 * const user = await requireUser()
 * const ctx = createAuthContext(user)
 * const projects = await getProjects(ctx)
 *
 * @example
 * // Cómo se verán los servicios futuros:
 * export async function getProjects(ctx: AuthContext) {
 *   return db.project.findMany({
 *     where: { organizationId: ctx.organizationId }, // ← siempre
 *   })
 * }
 */
export type AuthContext = {
  userId: string
  organizationId: string
}

/**
 * Crea un AuthContext a partir de un usuario autenticado.
 * Punto de entrada único para crear el contexto de servicios.
 */
export function createAuthContext(user: AuthUser): AuthContext {
  return {
    userId: user.id,
    organizationId: user.organizationId,
  }
}
