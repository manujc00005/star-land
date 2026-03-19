"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { parcelContactSchema } from "@/lib/validations/parcel-contact"
import {
  createParcelContact,
  deleteParcelContact,
} from "@/services/parcel-contact.service"

export type ContactActionState = { error?: string }

export async function createParcelContactAction(
  parcelId: string,
  projectId: string,
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const parsed = parcelContactSchema.safeParse({
    name:  formData.get("name"),
    role:  formData.get("role"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    await createParcelContact(ctx, parcelId, parsed.data)
  } catch {
    return { error: "Error al guardar el contacto." }
  }

  revalidatePath(`/projects/${projectId}`)
  return {}
}

export async function deleteParcelContactAction(
  contactId: string,
  projectId: string
): Promise<void> {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await deleteParcelContact(ctx, contactId)
  revalidatePath(`/projects/${projectId}`)
}
