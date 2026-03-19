import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import type { ContractInput, ContractStatus, ContractType } from "@/lib/validations/contract"

/**
 * Servicio de contratos.
 * Sigue el patrón AuthContext: todas las queries filtran por organizationId.
 * Antes de crear/actualizar, valida que parcel y owner pertenezcan a la org.
 */

export type ContractFilters = {
  type?: ContractType
  status?: ContractStatus
}

// ── Lectura ────────────────────────────────────────────────────────────────────

export async function getContracts(ctx: AuthContext, filters?: ContractFilters) {
  return db.contract.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    include: { parcel: true, owner: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getContractById(ctx: AuthContext, id: string) {
  const contract = await db.contract.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { parcel: true, owner: true },
  })
  if (!contract) notFound()
  return contract
}

/** Contratos vinculados a una parcela. Incluye propietario para evitar N+1. */
export async function getContractsByParcel(ctx: AuthContext, parcelId: string) {
  return db.contract.findMany({
    where: { parcelId, organizationId: ctx.organizationId },
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Contratos del proyecto a través de sus parcelas vinculadas.
 * Una sola query extra después de conocer los parcelIds — sin N+1.
 */
export async function getContractsByProject(ctx: AuthContext, projectId: string) {
  const links = await db.projectParcel.findMany({
    where: { projectId, organizationId: ctx.organizationId },
    select: { parcelId: true },
  })
  const parcelIds = links.map((l) => l.parcelId)
  if (parcelIds.length === 0) return []

  return db.contract.findMany({
    where: { organizationId: ctx.organizationId, parcelId: { in: parcelIds } },
    include: { parcel: true, owner: true },
    orderBy: { createdAt: "desc" },
  })
}

// ── Escritura ──────────────────────────────────────────────────────────────────

/**
 * Devuelve el primer contrato DRAFT o ACTIVE para una combinación
 * parcelId + ownerId dentro de la organización, o null si no existe.
 *
 * EXPIRED no se considera conflicto: es legítimo crear un contrato nuevo
 * sobre una parcela cuyo contrato anterior ha expirado.
 *
 * Usado por createPanelContractAction para evitar duplicados funcionales.
 *
 * TODO (pendiente de refinamiento): Si en el futuro una parcela puede tener
 * contratos simultáneos con distintos propietarios (multipropiedad), esta
 * lógica deberá revisarse. Actualmente bloquea cualquier DRAFT o ACTIVE
 * del mismo owner, independientemente del tipo.
 */
export async function findActiveContractForParcelAndOwner(
  ctx: AuthContext,
  parcelId: string,
  ownerId: string
) {
  return db.contract.findFirst({
    where: {
      organizationId: ctx.organizationId,
      parcelId,
      ownerId,
      status: { in: ["DRAFT", "ACTIVE"] },
    },
    select: { id: true, status: true, type: true },
  })
}

/** Valida que parcela y propietario pertenecen a la org antes de insertar. */
async function validateRelations(ctx: AuthContext, parcelId: string, ownerId: string) {
  const [parcel, owner] = await Promise.all([
    db.parcel.findFirst({ where: { id: parcelId, organizationId: ctx.organizationId } }),
    db.owner.findFirst({ where: { id: ownerId, organizationId: ctx.organizationId } }),
  ])
  if (!parcel) throw new Error("La parcela no pertenece a tu organización.")
  if (!owner) throw new Error("El propietario no pertenece a tu organización.")
}

export async function createContract(ctx: AuthContext, data: ContractInput) {
  await validateRelations(ctx, data.parcelId, data.ownerId)
  return db.contract.create({
    data: {
      type: data.type,
      status: data.status,
      price: data.price ?? null,
      signedAt: data.signedAt ?? null,
      parcelId: data.parcelId,
      ownerId: data.ownerId,
      organizationId: ctx.organizationId,
    },
  })
}

export async function updateContract(
  ctx: AuthContext,
  id: string,
  data: ContractInput
) {
  await getContractById(ctx, id) // verifica pertenencia
  await validateRelations(ctx, data.parcelId, data.ownerId)
  return db.contract.update({
    where: { id },
    data: {
      type: data.type,
      status: data.status,
      price: data.price ?? null,
      signedAt: data.signedAt ?? null,
      parcelId: data.parcelId,
      ownerId: data.ownerId,
    },
  })
}

export async function deleteContract(ctx: AuthContext, id: string) {
  await getContractById(ctx, id) // verifica pertenencia
  return db.contract.delete({ where: { id } })
}

/**
 * Actualiza únicamente el estado legal del contrato.
 * Operación quirúrgica: no requiere el resto de campos del contrato.
 * Verifica pertenencia a la organización antes de actualizar.
 *
 * El estado operativo de negociación vive en ProjectParcel.negotiationStatus.
 * La sincronización entre ambos (regla D2: ACTIVE → SIGNED) la gestiona
 * updateLinkedContractStatusAction en la capa de acciones, no aquí.
 */
export async function updateContractStatus(
  ctx: AuthContext,
  id: string,
  status: ContractStatus
) {
  await getContractById(ctx, id) // verifica pertenencia a la org
  return db.contract.update({
    where: { id },
    data: { status },
  })
}
