"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { ownerSchema } from "@/lib/validations/owner"
import {
  createOwner,
  updateOwner,
  deleteOwner,
} from "@/services/owner.service"

export type OwnerActionState = {
  error?: string
  success?: string
}

function parseOwnerForm(formData: FormData) {
  return ownerSchema.safeParse({
    name: formData.get("name"),
    nif: formData.get("nif"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
  })
}

export async function createOwnerAction(
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  const parsed = parseOwnerForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    await createOwner(ctx, parsed.data)
  } catch {
    return { error: "Error al crear el propietario. Inténtalo de nuevo." }
  }

  revalidatePath("/owners")
  redirect("/owners")
}

export async function updateOwnerAction(
  id: string,
  _prevState: OwnerActionState,
  formData: FormData
): Promise<OwnerActionState> {
  const parsed = parseOwnerForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    await updateOwner(ctx, id, parsed.data)
  } catch {
    return { error: "Error al actualizar el propietario. Inténtalo de nuevo." }
  }

  revalidatePath("/owners")
  redirect("/owners")
}

export async function deleteOwnerAction(id: string) {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await deleteOwner(ctx, id)
  revalidatePath("/owners")
}
