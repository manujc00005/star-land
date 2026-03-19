"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import {
  contractSchema,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  type ContractStatus,
  type ContractType,
} from "@/lib/validations/contract"
import {
  createContract,
  updateContract,
  deleteContract,
  updateContractStatus,
  findActiveContractForParcelAndOwner,
} from "@/services/contract.service"
import { updateNegotiationStatusByParcel } from "@/services/project-parcel.service"

export type ContractActionState = null | { error: string }

// Tipo de retorno para acciones inline (sin redirect)
export type PanelActionResult = { error?: string }

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseContractForm(formData: FormData) {
  return {
    type: formData.get("type"),
    status: formData.get("status"),
    price: formData.get("price"),
    signedAt: formData.get("signedAt"),
    parcelId: formData.get("parcelId"),
    ownerId: formData.get("ownerId"),
  }
}

// ── Crear ──────────────────────────────────────────────────────────────────────

export async function createContractAction(
  _prev: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const result = contractSchema.safeParse(parseContractForm(formData))
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await createContract(ctx, result.data)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear el contrato." }
  }

  redirect("/contracts")
}

// ── Actualizar ─────────────────────────────────────────────────────────────────

export async function updateContractAction(
  id: string,
  _prev: ContractActionState,
  formData: FormData
): Promise<ContractActionState> {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const result = contractSchema.safeParse(parseContractForm(formData))
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  try {
    await updateContract(ctx, id, result.data)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar el contrato." }
  }

  revalidatePath(`/contracts/${id}`)
  redirect(`/contracts/${id}`)
}

// ── Borrar ─────────────────────────────────────────────────────────────────────

export async function deleteContractAction(id: string): Promise<void> {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await deleteContract(ctx, id)
  revalidatePath("/contracts")
  redirect("/contracts")
}

// ── Acciones inline desde el panel de parcela ──────────────────────────────────
//
// Estas acciones NO redirigen. Revalidan solo la ruta del proyecto afectado
// y devuelven { error? } para que el componente cliente pueda mostrar el error.
// Siguen el patrón useTransition del resto del panel (ver parcel-panel.tsx).

/**
 * G1 — Cambia el estado legal de un contrato desde el panel de parcela.
 *
 * Nota: Contract.status es el estado legal/jurídico del contrato.
 * ProjectParcel.negotiationStatus es el estado operativo de negociación.
 * Son independientes salvo la regla D2: ACTIVE → auto-set SIGNED.
 *
 * ⚠️ Esta sincronización (D2) solo ocurre desde esta acción (panel de parcela).
 * Editar el contrato desde /contracts/[id]/edit NO actualiza negotiationStatus.
 */
export async function updateLinkedContractStatusAction(
  contractId: string,
  status: ContractStatus,
  projectId: string
): Promise<PanelActionResult> {
  if (!CONTRACT_STATUSES.includes(status)) {
    return { error: "Estado de contrato inválido." }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    const updated = await updateContractStatus(ctx, contractId, status)

    // D2: Cuando el contrato pasa a ACTIVE → marcar negociación como SIGNED.
    // Solo si el nuevo estado es ACTIVE para evitar regresiones al cambiar a DRAFT/EXPIRED.
    if (status === "ACTIVE") {
      await updateNegotiationStatusByParcel(ctx, projectId, updated.parcelId, "SIGNED")
    }

    revalidatePath(`/projects/${projectId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al actualizar el estado." }
  }
}

/**
 * G2+G3 — Crea un contrato DRAFT desde el panel de parcela, vinculando
 * la parcela con un propietario existente de la organización.
 *
 * TODO (VF2): Decisión asumida — asignar propietario desde el panel implica
 * crear un Contract con status DRAFT. Si se quiere una relación directa
 * ProjectParcel → Owner sin contrato, habría que añadir un campo ownerId
 * a ProjectParcel en el schema y migrar.
 */
export async function createPanelContractAction(
  parcelId: string,
  ownerId: string,
  type: ContractType,
  projectId: string
): Promise<PanelActionResult> {
  if (!parcelId || !ownerId) {
    return { error: "Parcela y propietario son obligatorios." }
  }
  if (!CONTRACT_TYPES.includes(type)) {
    return { error: "Tipo de contrato inválido." }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  // Bloque A: evitar duplicados funcionales.
  // Se bloquea si ya existe un contrato DRAFT o ACTIVE para esta parcela + propietario.
  // Un contrato EXPIRED no bloquea: es válido crear uno nuevo tras la expiración.
  const existing = await findActiveContractForParcelAndOwner(ctx, parcelId, ownerId)
  if (existing) {
    const estadoLabel =
      existing.status === "DRAFT" ? "en borrador" : "activo"
    return {
      error: `Ya existe un contrato ${estadoLabel} para esta parcela y propietario. Edítalo desde "Ver contrato completo" o espera a que expire antes de crear uno nuevo.`,
    }
  }

  try {
    await createContract(ctx, {
      type,
      status: "DRAFT",
      parcelId,
      ownerId,
    })
    revalidatePath(`/projects/${projectId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear el contrato." }
  }
}
