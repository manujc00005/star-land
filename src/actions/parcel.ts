"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { parcelSchema } from "@/lib/validations/parcel"
import { parseGeoJSONString, type GeoJSONGeometry } from "@/lib/validations/geojson"
import {
  createParcel,
  updateParcel,
  deleteParcel,
  type ParcelData,
} from "@/services/parcel.service"

export type ParcelActionState = {
  error?: string
  success?: string
}

/**
 * Parsea y valida todos los campos del formulario de parcela, incluida geometry.
 * geometry es opcional: vacío → null, no vacío → validado como GeoJSON.
 */
function parseParcelForm(
  formData: FormData
): { ok: true; data: ParcelData } | { ok: false; error: string } {
  const parsed = parcelSchema.safeParse({
    cadastralRef: formData.get("cadastralRef"),
    polygon: formData.get("polygon"),
    parcelNumber: formData.get("parcelNumber"),
    surface: formData.get("surface"),
    landUse: formData.get("landUse") || undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const rawGeometry = ((formData.get("geometry") as string) ?? "").trim()
  let geometry: GeoJSONGeometry | null = null

  if (rawGeometry) {
    const geoResult = parseGeoJSONString(rawGeometry)
    if (!geoResult.ok) {
      return { ok: false, error: geoResult.error }
    }
    geometry = geoResult.data
  }

  return { ok: true, data: { ...parsed.data, geometry } }
}

function isDuplicateCadastralRef(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  )
}

export async function createParcelAction(
  _prevState: ParcelActionState,
  formData: FormData
): Promise<ParcelActionState> {
  const result = parseParcelForm(formData)
  if (!result.ok) return { error: result.error }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  let parcel
  try {
    parcel = await createParcel(ctx, result.data)
  } catch (e) {
    if (isDuplicateCadastralRef(e)) {
      return {
        error:
          "Ya existe una parcela con esa referencia catastral en tu organización.",
      }
    }
    return { error: "Error al crear la parcela. Inténtalo de nuevo." }
  }

  revalidatePath("/parcels")
  redirect(`/parcels/${parcel.id}`)
}

export async function updateParcelAction(
  id: string,
  _prevState: ParcelActionState,
  formData: FormData
): Promise<ParcelActionState> {
  const result = parseParcelForm(formData)
  if (!result.ok) return { error: result.error }

  const user = await requireUser()
  const ctx = createAuthContext(user)

  try {
    await updateParcel(ctx, id, result.data)
  } catch (e) {
    if (isDuplicateCadastralRef(e)) {
      return {
        error:
          "Ya existe otra parcela con esa referencia catastral en tu organización.",
      }
    }
    return { error: "Error al actualizar la parcela. Inténtalo de nuevo." }
  }

  revalidatePath("/parcels")
  revalidatePath(`/parcels/${id}`)
  redirect(`/parcels/${id}`)
}

export async function deleteParcelAction(id: string) {
  const user = await requireUser()
  const ctx = createAuthContext(user)
  await deleteParcel(ctx, id)
  revalidatePath("/parcels")
}
