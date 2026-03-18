import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

/**
 * Tipo canónico del usuario autenticado en el sistema.
 * Se usa en Server Components, Server Actions y servicios.
 * organizationId siempre viene del JWT — nunca del cliente.
 */
export type AuthUser = {
  id: string
  name: string | null | undefined
  email: string
  organizationId: string
}

// ─── Helpers de sesión ────────────────────────────────────────────────────────

/**
 * Devuelve el usuario autenticado o null si no hay sesión.
 * Uso: Server Components y acciones donde la auth es opcional.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth()

  if (
    !session?.user?.id ||
    !session?.user?.email ||
    !session?.user?.organizationId
  ) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    organizationId: session.user.organizationId,
  }
}

/**
 * Devuelve el usuario autenticado. Redirige a /login si no hay sesión.
 * Uso: páginas y acciones que REQUIEREN autenticación.
 *
 * @example
 * // En un Server Component o Server Action:
 * const user = await requireUser()
 * // Si llega aquí, user es AuthUser garantizado
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/**
 * Devuelve el organizationId del usuario autenticado o null.
 * organizationId viene siempre de la sesión JWT — nunca del cliente.
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.organizationId ?? null
}

/**
 * Devuelve el organizationId. Redirige a /login si no hay sesión.
 * Uso: cualquier Server Action que necesite filtrar datos por organización.
 *
 * @example
 * // En un Server Action:
 * const orgId = await requireOrganizationId()
 * const projects = await db.project.findMany({
 *   where: { organizationId: orgId }
 * })
 */
export async function requireOrganizationId(): Promise<string> {
  const user = await requireUser()
  return user.organizationId
}
