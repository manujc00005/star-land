"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import {
  assignParcel,
  removeParcel,
  assignParcelsToProject,
  updateParcelAffectation,
  updateParcelNotes,
  type SpatialMatchResult,
} from "@/services/project-parcel.service"

// ── Tipos de estado para useActionState ────────────────────────────────────────

export type DetectState =
  | null
  | { phase: "done"; result: SpatialMatchResult }
  | { phase: "error"; error: string }

// ── Asignación manual ──────────────────────────────────────────────────────────

export async function assignParcelAction(
  projectId: string,
  parcelId: string
): Promise<void> {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await assignParcel(ctx, projectId, parcelId)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/parcels`)
}

export async function removeParcelAction(
  projectId: string,
  parcelId: string
): Promise<void> {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await removeParcel(ctx, projectId, parcelId)
  revalidatePath(`/projects/${projectId}`)
  revalidatePath(`/projects/${projectId}/parcels`)
}

// ── Afección ───────────────────────────────────────────────────────────────────

/**
 * Actualiza la afección de una parcela en un proyecto.
 * Se llama con useTransition desde AffectationSelect.
 */
export async function updateAffectationAction(
  projectParcelId: string,
  projectId: string,
  affectation: string | null
): Promise<void> {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await updateParcelAffectation(ctx, projectParcelId, affectation)
  revalidatePath(`/projects/${projectId}`)
}

// ── Notas de contratación ──────────────────────────────────────────────────────

export async function updateParcelNotesAction(
  projectParcelId: string,
  projectId: string,
  notes: string | null
): Promise<void> {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await updateParcelNotes(ctx, projectParcelId, notes)
  revalidatePath(`/projects/${projectId}`)
}

// ── Cruce espacial automático ──────────────────────────────────────────────────

/**
 * Ejecuta el cruce espacial: detecta parcelas que intersectan con el
 * recinto del proyecto y crea las relaciones automáticamente.
 *
 * Usa useActionState desde el cliente. El `projectId` se pasa con .bind().
 */
export async function detectParcelsAction(
  projectId: string,
  _prev: DetectState,
  _formData: FormData
): Promise<DetectState> {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    const result = await assignParcelsToProject(ctx, projectId)
    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/parcels`)
    return { phase: "done", result }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Error al ejecutar el cruce espacial."
    return { phase: "error", error: message }
  }
}
