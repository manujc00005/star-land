"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { db } from "@/lib/db"
import type { NegotiationStatus } from "@/lib/validations/negotiation-status"
import { NEGOTIATION_STATUSES } from "@/lib/validations/negotiation-status"
import type { ProjectStatus } from "@/lib/validations/project"
import { PROJECT_STATUSES } from "@/lib/validations/project"

// ── Tipos ────────────────────────────────────────────────────────────────────

export type ImportRow = {
  refCatastral: string
  municipio: string
  poligono: string
  parcela: string
  superficie: number
  propietario: string
  nifPropietario: string
  estadoNegociacion: string
  email: string
  telefono: string
  notas: string
}

export type ProjectImportPayload = {
  project: {
    name: string
    cluster: string
    developer: string
    spv: string
    status: string
    technologyType: string
    technologyMW: string
  }
  rows: ImportRow[]
}

export type ImportSummary = {
  projectId: string
  projectName: string
  parcelsCreated: number
  parcelsExisting: number
  ownersCreated: number
  ownersExisting: number
  relationsCreated: number
}

export type ProjectImportState =
  | null
  | { phase: "done"; summary: ImportSummary }
  | { phase: "error"; error: string }

// ── Action ───────────────────────────────────────────────────────────────────

export async function importProjectAction(
  _prev: ProjectImportState,
  formData: FormData,
): Promise<ProjectImportState> {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const raw = formData.get("payload") as string | null
  if (!raw) return { phase: "error", error: "Datos de importación no encontrados." }

  let payload: ProjectImportPayload
  try {
    payload = JSON.parse(raw)
  } catch {
    return { phase: "error", error: "Datos de importación inválidos." }
  }

  const { project: proj, rows } = payload

  if (!proj.name?.trim()) {
    return { phase: "error", error: "El nombre del proyecto es obligatorio." }
  }

  if (rows.length === 0) {
    return { phase: "error", error: "No hay filas para importar." }
  }

  try {
    // 1. Crear proyecto
    const powerMW = proj.technologyMW ? parseFloat(proj.technologyMW) : null
    const technologies = proj.technologyType
      ? [{ type: proj.technologyType, ...(powerMW ? { powerMW } : {}) }]
      : []

    const status: ProjectStatus = (PROJECT_STATUSES as readonly string[]).includes(proj.status)
      ? (proj.status as ProjectStatus)
      : "OPPORTUNITY"

    const project = await db.project.create({
      data: {
        name: proj.name.trim(),
        cluster: proj.cluster?.trim() || null,
        developer: proj.developer?.trim() || null,
        spv: proj.spv?.trim() || null,
        status,
        technologies: technologies.length > 0 ? technologies : undefined,
        powerMW: powerMW && powerMW > 0 ? powerMW : null,
        organizationId: ctx.organizationId,
      },
    })

    // 2. Procesar parcelas
    let parcelsCreated = 0
    let parcelsExisting = 0
    let ownersCreated = 0
    let ownersExisting = 0
    let relationsCreated = 0

    // Get existing cadastral refs
    const refs = rows.map((r) => r.refCatastral).filter(Boolean)
    const existingParcels = await db.parcel.findMany({
      where: { organizationId: ctx.organizationId, cadastralRef: { in: refs } },
      select: { id: true, cadastralRef: true },
    })
    const parcelByRef = new Map(existingParcels.map((p) => [p.cadastralRef, p.id]))

    // Get existing owners by NIF
    const nifs = rows.map((r) => r.nifPropietario).filter(Boolean)
    const existingOwners = await db.owner.findMany({
      where: { organizationId: ctx.organizationId, nif: { in: nifs } },
      select: { id: true, nif: true },
    })
    const ownerByNif = new Map(existingOwners.map((o) => [o.nif, o.id]))

    const processedRefs = new Set<string>()

    for (const row of rows) {
      if (!row.refCatastral?.trim()) continue
      const ref = row.refCatastral.trim()

      // Skip duplicates within import
      if (processedRefs.has(ref)) continue
      processedRefs.add(ref)

      // 2a. Create or find parcel
      let parcelId = parcelByRef.get(ref)
      if (!parcelId) {
        const surface = typeof row.superficie === "number" ? row.superficie : parseFloat(String(row.superficie)) || 0
        const parcel = await db.parcel.create({
          data: {
            cadastralRef: ref,
            polygon: row.poligono?.trim() || "—",
            parcelNumber: row.parcela?.trim() || "—",
            surface: surface > 0 ? surface : 0,
            municipality: row.municipio?.trim() || null,
            organizationId: ctx.organizationId,
          },
        })
        parcelId = parcel.id
        parcelByRef.set(ref, parcelId)
        parcelsCreated++
      } else {
        parcelsExisting++
      }

      // 2b. Create or find owner (if NIF provided)
      let ownerId: string | null = null
      if (row.nifPropietario?.trim()) {
        const nif = row.nifPropietario.trim()
        ownerId = ownerByNif.get(nif) ?? null
        if (!ownerId) {
          const owner = await db.owner.create({
            data: {
              name: row.propietario?.trim() || nif,
              nif,
              phone: row.telefono?.trim() || null,
              email: row.email?.trim() || null,
              organizationId: ctx.organizationId,
            },
          })
          ownerId = owner.id
          ownerByNif.set(nif, ownerId)
          ownersCreated++
        } else {
          ownersExisting++
        }
      } else if (row.propietario?.trim()) {
        // Owner name without NIF - create with name as NIF placeholder
        const owner = await db.owner.create({
          data: {
            name: row.propietario.trim(),
            nif: `PENDING-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            phone: row.telefono?.trim() || null,
            email: row.email?.trim() || null,
            organizationId: ctx.organizationId,
          },
        })
        ownerId = owner.id
        ownersCreated++
      }

      // 2c. Link parcel to project (ProjectParcel)
      const negStatus = (NEGOTIATION_STATUSES as readonly string[]).includes(row.estadoNegociacion)
        ? (row.estadoNegociacion as NegotiationStatus)
        : "SEARCHING"

      const existingLink = await db.projectParcel.findFirst({
        where: { projectId: project.id, parcelId },
      })

      if (!existingLink) {
        await db.projectParcel.create({
          data: {
            projectId: project.id,
            parcelId,
            negotiationStatus: negStatus,
            affectation: null,
            notes: row.notas?.trim() || null,
            organizationId: ctx.organizationId,
          },
        })
        relationsCreated++
      }
    }

    revalidatePath("/projects")
    revalidatePath("/parcels")
    revalidatePath("/owners")

    return {
      phase: "done",
      summary: {
        projectId: project.id,
        projectName: project.name,
        parcelsCreated,
        parcelsExisting,
        ownersCreated,
        ownersExisting,
        relationsCreated,
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error durante la importación."
    return { phase: "error", error: msg }
  }
}
