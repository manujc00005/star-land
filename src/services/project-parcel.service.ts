import { notFound } from "next/navigation"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import { geojsonGeometrySchema } from "@/lib/validations/geojson"
import { geometriesIntersect } from "@/lib/gis/spatial"

/**
 * Servicio para la relación M:N Project ↔ Parcel.
 * Sigue el patrón AuthContext: todas las queries filtran por organizationId.
 */

// ── Tipos públicos ─────────────────────────────────────────────────────────────

/** Resumen del cruce espacial automático */
export type SpatialMatchResult = {
  /** Parcelas con geometry válida que se analizaron */
  analyzedParcels: number
  /** Parcelas que intersectan con el proyecto */
  intersected: number
  /** Nuevas relaciones creadas en esta ejecución */
  created: number
  /** Relaciones que ya existían (no duplicadas) */
  alreadyExisted: number
  /** Parcelas de la organización sin geometry (ignoradas) */
  skippedNoGeometry: number
  /** Parcelas con geometry presente pero inválida (ignoradas) */
  errors: number
}

// ── Funciones de lectura ───────────────────────────────────────────────────────

/** Devuelve las parcelas asignadas a un proyecto, con los datos de la parcela. */
export async function getProjectParcels(ctx: AuthContext, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: ctx.organizationId },
  })
  if (!project) notFound()

  return db.projectParcel.findMany({
    where: { projectId, organizationId: ctx.organizationId },
    include: { parcel: true },
    orderBy: { createdAt: "asc" },
  })
}

/**
 * Busca parcelas de la organización que NO están asignadas al proyecto.
 * Si `query` está vacío devuelve las primeras 30 disponibles.
 */
export async function searchAvailableParcels(
  ctx: AuthContext,
  projectId: string,
  query: string
) {
  const assigned = await db.projectParcel.findMany({
    where: { projectId, organizationId: ctx.organizationId },
    select: { parcelId: true },
  })
  const assignedIds = assigned.map((a) => a.parcelId)

  const where: Prisma.ParcelWhereInput = {
    organizationId: ctx.organizationId,
  }
  if (assignedIds.length > 0) {
    where.id = { notIn: assignedIds }
  }
  const trimmed = query.trim()
  if (trimmed) {
    where.OR = [
      { cadastralRef: { contains: trimmed, mode: "insensitive" } },
      { parcelNumber: { contains: trimmed, mode: "insensitive" } },
      { polygon: { contains: trimmed, mode: "insensitive" } },
    ]
  }

  return db.parcel.findMany({
    where,
    orderBy: { cadastralRef: "asc" },
    take: 30,
  })
}

/** Devuelve los proyectos a los que está asignada una parcela. */
export async function getParcelProjects(ctx: AuthContext, parcelId: string) {
  return db.projectParcel.findMany({
    where: { parcelId, organizationId: ctx.organizationId },
    include: { project: true },
    orderBy: { createdAt: "asc" },
  })
}

// ── Funciones de escritura ─────────────────────────────────────────────────────

/** Asigna una parcela a un proyecto. Valida que ambos pertenezcan a la org. */
export async function assignParcel(
  ctx: AuthContext,
  projectId: string,
  parcelId: string
) {
  const [project, parcel] = await Promise.all([
    db.project.findFirst({
      where: { id: projectId, organizationId: ctx.organizationId },
    }),
    db.parcel.findFirst({
      where: { id: parcelId, organizationId: ctx.organizationId },
    }),
  ])
  if (!project || !parcel) notFound()

  return db.projectParcel.create({
    data: { projectId, parcelId, organizationId: ctx.organizationId },
  })
}

/**
 * Actualiza la afección de una parcela en un proyecto concreto.
 * Valida multi-tenant via organizationId. Pasa null para limpiarla.
 */
export async function updateParcelAffectation(
  ctx: AuthContext,
  projectParcelId: string,
  affectation: string | null
) {
  const record = await db.projectParcel.findFirst({
    where: { id: projectParcelId, organizationId: ctx.organizationId },
  })
  if (!record) notFound()
  return db.projectParcel.update({
    where: { id: projectParcelId },
    data: { affectation },
  })
}

/**
 * Actualiza las notas de contratación de una parcela en un proyecto concreto.
 * Pasa null para limpiarlas.
 */
export async function updateParcelNotes(
  ctx: AuthContext,
  projectParcelId: string,
  notes: string | null
) {
  const record = await db.projectParcel.findFirst({
    where: { id: projectParcelId, organizationId: ctx.organizationId },
  })
  if (!record) notFound()
  return db.projectParcel.update({
    where: { id: projectParcelId },
    data: { notes },
  })
}

/** Desvincula una parcela de un proyecto. */
export async function removeParcel(
  ctx: AuthContext,
  projectId: string,
  parcelId: string
) {
  await db.projectParcel.deleteMany({
    where: { projectId, parcelId, organizationId: ctx.organizationId },
  })
}

// ── Cruce espacial automático ──────────────────────────────────────────────────

/**
 * Detecta qué parcelas de la organización intersectan con el recinto del
 * proyecto y crea las relaciones ProjectParcel correspondientes.
 *
 * Flujo:
 *   1. Obtener y validar geometry del proyecto
 *   2. Obtener todas las parcelas de la org con geometry
 *   3. Comprobar intersección con Turf.js booleanIntersects
 *   4. Crear relaciones nuevas en bloque (skipDuplicates)
 *   5. Devolver resumen
 *
 * Preparado para PostGIS: cuando se migre, reemplaza el paso 3 por una
 * query tipo WHERE ST_Intersects(parcel.geometry, project.geometry) y
 * elimina el bucle en aplicación.
 *
 * Límite MVP: itera sobre parcelas en memoria. Aceptable para <10.000
 * parcelas. Con más volumen, usar PostGIS o procesamiento en background.
 */
export async function assignParcelsToProject(
  ctx: AuthContext,
  projectId: string
): Promise<SpatialMatchResult> {
  // 1. Obtener proyecto y validar pertenencia a la org
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: ctx.organizationId },
    select: { id: true, geometry: true },
  })
  if (!project) notFound()

  // 2. Validar geometry del proyecto
  if (!project.geometry) {
    throw new Error(
      "El proyecto no tiene geometría definida. Añade el recinto del proyecto antes de ejecutar el cruce."
    )
  }

  const projectGeoResult = geojsonGeometrySchema.safeParse(project.geometry)
  if (!projectGeoResult.success) {
    throw new Error(
      "La geometría del proyecto no es válida. Revisa el GeoJSON del recinto."
    )
  }
  const projectGeometry = projectGeoResult.data

  // 3. Obtener todas las parcelas de la org (solo id y geometry para eficiencia)
  const allParcels = await db.parcel.findMany({
    where: { organizationId: ctx.organizationId },
    select: { id: true, geometry: true },
  })

  const skippedNoGeometry = allParcels.filter((p) => !p.geometry).length
  const parcelsWithGeometry = allParcels.filter((p) => p.geometry !== null)

  // 4. Obtener relaciones ya existentes para evitar duplicados
  const existing = await db.projectParcel.findMany({
    where: { projectId, organizationId: ctx.organizationId },
    select: { parcelId: true },
  })
  const existingIds = new Set(existing.map((e) => e.parcelId))

  // 5. Comprobar intersección parcela a parcela
  let analyzedParcels = 0
  let errors = 0
  let alreadyExisted = 0
  const toCreate: string[] = []

  for (const parcel of parcelsWithGeometry) {
    const geoResult = geojsonGeometrySchema.safeParse(parcel.geometry)
    if (!geoResult.success) {
      errors++
      continue
    }

    analyzedParcels++

    let doesIntersect = false
    try {
      doesIntersect = geometriesIntersect(projectGeometry, geoResult.data)
    } catch {
      errors++
      continue
    }

    if (doesIntersect) {
      if (existingIds.has(parcel.id)) {
        alreadyExisted++
      } else {
        toCreate.push(parcel.id)
      }
    }
  }

  // 6. Crear relaciones nuevas en bloque
  if (toCreate.length > 0) {
    await db.projectParcel.createMany({
      data: toCreate.map((parcelId) => ({
        projectId,
        parcelId,
        organizationId: ctx.organizationId,
      })),
      skipDuplicates: true,
    })
  }

  return {
    analyzedParcels,
    intersected: toCreate.length + alreadyExisted,
    created: toCreate.length,
    alreadyExisted,
    skippedNoGeometry,
    errors,
  }
}
