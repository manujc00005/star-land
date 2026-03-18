import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import type { ProjectInput } from "@/lib/validations/project"
import type { GeoJSONGeometry } from "@/lib/validations/geojson"

/**
 * Servicio de proyectos.
 * Sigue el patrón AuthContext: todas las queries filtran por ctx.organizationId.
 * organizationId nunca viene del cliente — siempre de la sesión JWT.
 */

export async function getProjects(ctx: AuthContext) {
  return db.project.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getProjectById(ctx: AuthContext, id: string) {
  const project = await db.project.findFirst({
    where: { id, organizationId: ctx.organizationId },
  })
  if (!project) notFound()
  return project
}

export async function createProject(ctx: AuthContext, data: ProjectInput) {
  return db.project.create({
    data: {
      ...data,
      organizationId: ctx.organizationId,
    },
  })
}

export async function updateProject(
  ctx: AuthContext,
  id: string,
  data: ProjectInput
) {
  await getProjectById(ctx, id)
  return db.project.update({ where: { id }, data })
}

export async function deleteProject(ctx: AuthContext, id: string) {
  await getProjectById(ctx, id)
  return db.project.delete({ where: { id } })
}

/**
 * Actualiza solo el campo geometry de un proyecto.
 * Separado de updateProject para que el formulario general
 * nunca toque ni borre accidentalmente la geometría.
 * Pasa null para eliminar la geometría.
 */
export async function updateProjectGeometry(
  ctx: AuthContext,
  id: string,
  geometry: GeoJSONGeometry | null
) {
  await getProjectById(ctx, id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.project.update({ where: { id }, data: { geometry: geometry as any } })
}
