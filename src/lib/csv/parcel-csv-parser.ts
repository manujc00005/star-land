/**
 * Parser de CSV para importación de parcelas.
 *
 * Solo se importa en servidor (server actions). PapaParse corre
 * de forma síncrona en Node.js sin DOM.
 *
 * Flujo:
 *   1. PapaParse → filas raw como Record<string, string>
 *   2. detectHeaders → mapeo de cabeceras tolerante a alias
 *   3. Por fila: validación Zod + validación GeoJSON opcional
 *   4. Deduplicación in-CSV (keep first occurrence)
 *   5. Consulta BD para detectar refs existentes en la org
 *   6. Retorna ParseResult completo para la preview
 */

import Papa from "papaparse"
import { z } from "zod"
import { db } from "@/lib/db"
import type { AuthContext } from "@/services/base"
import { parseGeoJSONString } from "@/lib/validations/geojson"
import type { GeoJSONGeometry } from "@/lib/validations/geojson"
import { detectHeaders } from "./column-aliases"

// ── Límites ────────────────────────────────────────────────────────────────────

export const IMPORT_MAX_ROWS = 2_000
// Next.js limita el body de server actions a 1MB por defecto.
// Un CSV de 2000 filas sin geometry ocupa ~200-400KB — suficiente para MVP.
// Para archivos más grandes, dividir el CSV en partes.
export const IMPORT_MAX_BYTES = 900 * 1024 // 900KB (margen bajo el límite de 1MB)

// ── Tipos públicos ─────────────────────────────────────────────────────────────

/** Fila válida y lista para insertar en BD */
export type ValidImportRow = {
  cadastralRef: string
  polygon: string
  parcelNumber: string
  surface: number
  landUse: string | null
  municipality: string | null
  geometry: GeoJSONGeometry | null
}

/** Fila con errores de validación */
export type InvalidImportRow = {
  rowNumber: number
  rawCadastralRef: string
  errors: string[]
}

/** Resultado del análisis del CSV. Serializable (JSON safe). */
export type ParseResult = {
  totalRows: number
  validRows: ValidImportRow[]
  invalidRows: InvalidImportRow[]
  /** Refs que aparecen >1 vez en el CSV. Solo se guarda la primera ocurrencia. */
  inCsvDuplicates: string[]
  /** Refs que ya existen en la BD de esta organización. */
  existingInDb: string[]
  /** Filas que se insertarán: válidas - in-csv-dup - ya-en-bd */
  insertableRows: ValidImportRow[]
}

/** Resumen de una importación confirmada */
export type ImportResult = {
  totalCsvRows: number
  inserted: number
  skippedDbDuplicates: number
  skippedInvalidRows: number
  skippedCsvDuplicates: number
}

// ── Schema de validación por fila ──────────────────────────────────────────────

const csvRowSchema = z.object({
  cadastralRef: z
    .string()
    .min(1, "Referencia catastral vacía")
    .max(50, "Referencia catastral demasiado larga")
    .transform((s) => s.trim()),
  polygon: z
    .string()
    .min(1, "Polígono vacío")
    .max(50, "Polígono demasiado largo")
    .transform((s) => s.trim()),
  parcelNumber: z
    .string()
    .min(1, "Número de parcela vacío")
    .max(50, "Número de parcela demasiado largo")
    .transform((s) => s.trim()),
  surface: z.coerce
    .number({ message: "Superficie inválida: debe ser un número" })
    .positive("Superficie debe ser mayor que 0"),
  landUse: z
    .string()
    .max(200)
    .optional()
    .transform((v) => v?.trim() || null),
  municipality: z
    .string()
    .max(200)
    .optional()
    .transform((v) => v?.trim() || null),
})

// ── Función principal ──────────────────────────────────────────────────────────

export async function parseParcelCSV(
  text: string,
  ctx: AuthContext
): Promise<ParseResult> {
  // 1. Parsear CSV
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h: string) => h.trim(),
  })

  const rows = parsed.data
  const totalRows = rows.length

  if (totalRows === 0) {
    throw new Error("El archivo CSV está vacío o no contiene datos.")
  }

  if (totalRows > IMPORT_MAX_ROWS) {
    throw new Error(
      `El CSV tiene ${totalRows.toLocaleString("es-ES")} filas. El máximo por importación es ${IMPORT_MAX_ROWS.toLocaleString("es-ES")}. Divide el archivo en partes más pequeñas.`
    )
  }

  // 2. Detectar cabeceras
  const headers = Object.keys(rows[0] ?? {})
  const { mapping, missing } = detectHeaders(headers)

  if (missing.length > 0) {
    throw new Error(
      `Columnas requeridas no encontradas: ${missing.join(", ")}. Cabeceras detectadas: ${headers.join(", ")}.`
    )
  }

  // 3. Validar fila a fila
  const allValidRows: ValidImportRow[] = []
  const invalidRows: InvalidImportRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = i + 2 // fila 1 = cabeceras, empezamos en 2
    const errors: string[] = []

    // Extraer valores con el mapeo de cabeceras
    const get = (field: keyof typeof mapping) =>
      (mapping[field] ? row[mapping[field]!] : "") ?? ""

    const rawData = {
      cadastralRef: get("cadastralRef"),
      polygon: get("polygon"),
      parcelNumber: get("parcelNumber"),
      surface: get("surface"),
      landUse: get("landUse") || undefined,
      municipality: get("municipality") || undefined,
    }
    const rawGeometry = get("geometry").trim()

    // Validar campos escalares
    const schemaResult = csvRowSchema.safeParse(rawData)
    if (!schemaResult.success) {
      for (const issue of schemaResult.error.issues) {
        errors.push(issue.message)
      }
    }

    // Validar geometry si viene informada
    let geometry: GeoJSONGeometry | null = null
    if (rawGeometry) {
      const geoResult = parseGeoJSONString(rawGeometry)
      if (!geoResult.ok) {
        errors.push(`Geometry inválida: ${geoResult.error}`)
      } else {
        geometry = geoResult.data
      }
    }

    if (errors.length > 0) {
      invalidRows.push({
        rowNumber,
        rawCadastralRef: rawData.cadastralRef.trim() || "(vacío)",
        errors,
      })
    } else if (schemaResult.success) {
      allValidRows.push({
        cadastralRef: schemaResult.data.cadastralRef,
        polygon: schemaResult.data.polygon,
        parcelNumber: schemaResult.data.parcelNumber,
        surface: schemaResult.data.surface,
        landUse: schemaResult.data.landUse,
        municipality: schemaResult.data.municipality,
        geometry,
      })
    }
  }

  // 4. Deduplicar in-CSV (mantener primera ocurrencia)
  const validByRef = new Map<string, ValidImportRow>()
  const inCsvDuplicateSet = new Set<string>()

  for (const row of allValidRows) {
    if (validByRef.has(row.cadastralRef)) {
      inCsvDuplicateSet.add(row.cadastralRef)
    } else {
      validByRef.set(row.cadastralRef, row)
    }
  }

  const validRows = Array.from(validByRef.values())
  const inCsvDuplicates = Array.from(inCsvDuplicateSet)

  // 5. Consultar BD para detectar refs existentes en esta organización
  let existingInDb: string[] = []
  if (validRows.length > 0) {
    const refs = validRows.map((r) => r.cadastralRef)
    const existing = await db.parcel.findMany({
      where: { organizationId: ctx.organizationId, cadastralRef: { in: refs } },
      select: { cadastralRef: true },
    })
    existingInDb = existing.map((e) => e.cadastralRef)
  }

  const existingSet = new Set(existingInDb)
  const insertableRows = validRows.filter(
    (r) => !existingSet.has(r.cadastralRef)
  )

  return {
    totalRows,
    validRows,
    invalidRows,
    inCsvDuplicates,
    existingInDb,
    insertableRows,
  }
}
