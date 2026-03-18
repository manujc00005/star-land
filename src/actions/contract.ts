"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { contractSchema } from "@/lib/validations/contract"
import {
  createContract,
  updateContract,
  deleteContract,
} from "@/services/contract.service"

export type ContractActionState = null | { error: string }

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
