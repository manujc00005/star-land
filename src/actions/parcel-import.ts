"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { db } from "@/lib/db"
import {
  parseParcelCSV,
  IMPORT_MAX_BYTES,
  type ParseResult,
  type ImportResult,
  type ValidImportRow,
} from "@/lib/csv/parcel-csv-parser"

// ── Tipos de estado para useActionState ────────────────────────────────────────

export type AnalyzeState =
  | null
  | { phase: "preview"; parseResult: ParseResult }
  | { phase: "error"; error: string }

export type ImportState =
  | null
  | { phase: "done"; result: ImportResult }
  | { phase: "error"; error: string }

// ── Contexto serializado que viaja en el form de confirmación ──────────────────

type ImportContext = {
  totalCsvRows: number
  invalidCount: number
  inCsvDupCount: number
  rows: ValidImportRow[] // insertableRows del analyze step
}

// ── Action 1: Analizar CSV ─────────────────────────────────────────────────────

/**
 * Recibe el archivo CSV, lo parsea y valida en servidor, consulta la BD
 * para detectar duplicados existentes y devuelve el ParseResult para preview.
 *
 * No modifica nada en BD. Solo lectura.
 */
export async function analyzeCSVAction(
  _prev: AnalyzeState,
  formData: FormData
): Promise<AnalyzeState> {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    return { phase: "error", error: "Selecciona un archivo CSV." }
  }

  if (file.size > IMPORT_MAX_BYTES) {
    return {
      phase: "error",
      error: `El archivo es demasiado grande (${(file.size / 1024).toFixed(0)} KB). Máximo permitido: 900 KB. Divide el CSV en partes más pequeñas.`,
    }
  }

  // Validación básica de extensión (tolerante a MIME types inconsistentes)
  const name = file.name.toLowerCase()
  if (!name.endsWith(".csv") && !name.endsWith(".txt")) {
    return {
      phase: "error",
      error: "El archivo debe ser CSV (.csv). Otros formatos no están soportados.",
    }
  }

  let text: string
  try {
    text = await file.text()
  } catch {
    return { phase: "error", error: "No se pudo leer el archivo." }
  }

  try {
    const parseResult = await parseParcelCSV(text, ctx)
    return { phase: "preview", parseResult }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al analizar el CSV."
    return { phase: "error", error: message }
  }
}

// ── Action 2: Importar filas confirmadas ───────────────────────────────────────

/**
 * Recibe el contexto serializado del analyze step (vía hidden input).
 * Re-verifica duplicados en BD para protegerse de race conditions.
 * Inserta en bulk con createMany.
 */
export async function importParcelsAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const raw = formData.get("context") as string | null
  if (!raw) {
    return { phase: "error", error: "Contexto de importación no encontrado." }
  }

  let context: ImportContext
  try {
    context = JSON.parse(raw) as ImportContext
  } catch {
    return { phase: "error", error: "Contexto de importación inválido." }
  }

  const { totalCsvRows, invalidCount, inCsvDupCount, rows } = context

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      phase: "done",
      result: {
        totalCsvRows,
        inserted: 0,
        skippedDbDuplicates: 0,
        skippedInvalidRows: invalidCount,
        skippedCsvDuplicates: inCsvDupCount,
      },
    }
  }

  // Re-verificar BD (protección ante race conditions entre preview e import)
  const refs = rows.map((r) => r.cadastralRef)
  const existing = await db.parcel.findMany({
    where: {
      organizationId: ctx.organizationId,
      cadastralRef: { in: refs },
    },
    select: { cadastralRef: true },
  })
  const existingSet = new Set(existing.map((e) => e.cadastralRef))

  const toInsert = rows.filter((r) => !existingSet.has(r.cadastralRef))
  const skippedDbDuplicates = rows.length - toInsert.length

  if (toInsert.length > 0) {
    await db.parcel.createMany({
      data: toInsert.map((row) => ({
        cadastralRef: row.cadastralRef,
        polygon: row.polygon,
        parcelNumber: row.parcelNumber,
        surface: row.surface,
        landUse: row.landUse,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geometry: row.geometry as any,
        organizationId: ctx.organizationId,
      })),
    })
  }

  revalidatePath("/parcels")

  return {
    phase: "done",
    result: {
      totalCsvRows,
      inserted: toInsert.length,
      skippedDbDuplicates,
      skippedInvalidRows: invalidCount,
      skippedCsvDuplicates: inCsvDupCount,
    },
  }
}
