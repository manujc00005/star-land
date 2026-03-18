import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import type { ParcelFormInput } from "@/lib/validations/parcel"
import type { GeoJSONGeometry } from "@/lib/validations/geojson"

/**
 * Servicio de parcelas.
 * Sigue el patrón AuthContext: todas las queries filtran por ctx.organizationId.
 * organizationId nunca viene del cliente — siempre de la sesión JWT.
 *
 * geometry se pasa como GeoJSONGeometry | null para tipado estricto en
 * la capa de servicio, y se castea a any solo en la llamada a Prisma
 * (limitación del tipo Json de Prisma sin PostGIS).
 */

// Tipo combinado que usan las funciones create/update
export type ParcelData = ParcelFormInput & { geometry: GeoJSONGeometry | null }

export async function getParcels(ctx: AuthContext) {
  return db.parcel.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getParcelById(ctx: AuthContext, id: string) {
  const parcel = await db.parcel.findFirst({
    where: { id, organizationId: ctx.organizationId },
  })
  if (!parcel) notFound()
  return parcel
}

export async function createParcel(ctx: AuthContext, data: ParcelData) {
  return db.parcel.create({
    data: {
      cadastralRef: data.cadastralRef,
      polygon: data.polygon,
      parcelNumber: data.parcelNumber,
      surface: data.surface,
      landUse: data.landUse,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      geometry: data.geometry as any,
      organizationId: ctx.organizationId,
    },
  })
}

export async function updateParcel(
  ctx: AuthContext,
  id: string,
  data: ParcelData
) {
  await getParcelById(ctx, id) // verifica pertenencia antes de actualizar
  return db.parcel.update({
    where: { id },
    data: {
      cadastralRef: data.cadastralRef,
      polygon: data.polygon,
      parcelNumber: data.parcelNumber,
      surface: data.surface,
      landUse: data.landUse,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      geometry: data.geometry as any,
    },
  })
}

export async function deleteParcel(ctx: AuthContext, id: string) {
  await getParcelById(ctx, id) // verifica pertenencia antes de borrar
  return db.parcel.delete({ where: { id } })
}
