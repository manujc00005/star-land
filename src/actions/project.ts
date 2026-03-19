"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { projectSchema, type Technology } from "@/lib/validations/project"
import { parseGeoJSONString } from "@/lib/validations/geojson"
import {
  createProject,
  updateProject,
  deleteProject,
  updateProjectGeometry,
} from "@/services/project.service"

export type ProjectActionState = {
  error?: string
  success?: string
}

/**
 * Extrae y valida los campos del formulario de proyecto.
 * technologies llega como JSON serializado en un hidden input.
 * connectionPoints llega como JSON serializado en un hidden input.
 */
function parseProjectForm(formData: FormData) {
  let technologies: Technology[] = []
  let connectionPoints: string[] = []

  try {
    const raw = formData.get("technologies")
    technologies = raw ? JSON.parse(raw as string) : []
  } catch {
    // Zod se encargará del error de validación
  }

  try {
    const raw = formData.get("connectionPoints")
    connectionPoints = raw ? JSON.parse(raw as string) : []
  } catch {
    connectionPoints = []
  }

  return projectSchema.safeParse({
    name:             formData.get("name"),
    technologies,
    status:           formData.get("status"),
    connectionPoints,
    cluster:          formData.get("cluster"),
    developer:        formData.get("developer"),
    spv:              formData.get("spv"),
  })
}

/** Suma las potencias de las tecnologías. Devuelve null si ninguna tiene potencia. */
function computePowerMW(technologies: Technology[]): number | null {
  const total = technologies.reduce((sum, t) => sum + (t.powerMW ?? 0), 0)
  return total > 0 ? total : null
}

export async function createProjectAction(
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const parsed = parseProjectForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  let project
  try {
    project = await createProject(ctx, {
      ...parsed.data,
      powerMW: computePowerMW(parsed.data.technologies),
    })
  } catch {
    return { error: "Error al crear el proyecto. Inténtalo de nuevo." }
  }

  revalidatePath("/projects")
  redirect(`/projects/${project.id}`)
}

export async function updateProjectAction(
  id: string,
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const parsed = parseProjectForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    await updateProject(ctx, id, {
      ...parsed.data,
      powerMW: computePowerMW(parsed.data.technologies),
    })
  } catch {
    return { error: "Error al actualizar el proyecto. Inténtalo de nuevo." }
  }

  revalidatePath("/projects")
  revalidatePath(`/projects/${id}`)
  redirect(`/projects/${id}`)
}

export async function deleteProjectAction(id: string) {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await deleteProject(ctx, id)
  revalidatePath("/projects")
}

/**
 * Guarda o elimina la geometría de un proyecto.
 * - Textarea vacío → geometry = null (elimina)
 * - Textarea con contenido → valida como GeoJSON y guarda
 *
 * No redirige — el usuario permanece en el detalle para ver el resultado.
 */
export async function updateProjectGeometryAction(
  id: string,
  _prevState: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const raw = (formData.get("geometry") as string).trim()

  const user = await requireUser()
  const ctx = createAuthContext(user)

  // Vacío = eliminar geometría
  if (!raw) {
    try {
      await updateProjectGeometry(ctx, id, null)
    } catch {
      return { error: "Error al eliminar la geometría." }
    }
    revalidatePath(`/projects/${id}`)
    return { success: "Geometría eliminada." }
  }

  // Parsear y validar GeoJSON
  const result = parseGeoJSONString(raw)
  if (!result.ok) {
    return { error: result.error }
  }

  try {
    await updateProjectGeometry(ctx, id, result.data)
  } catch {
    return { error: "Error al guardar la geometría. Inténtalo de nuevo." }
  }

  revalidatePath(`/projects/${id}`)
  return { success: "Geometría guardada correctamente." }
}
