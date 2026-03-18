"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { projectSchema } from "@/lib/validations/project"
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

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    powerMW: formData.get("powerMW"),
    status: formData.get("status"),
  })
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
    project = await createProject(ctx, parsed.data)
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
    await updateProject(ctx, id, parsed.data)
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
