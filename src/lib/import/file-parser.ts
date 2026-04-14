/**
 * Parser de archivos para importación.
 * Soporta .xlsx, .csv, .tsv — todo client-side.
 *
 * Para Excel: auto-detecta la fila de headers buscando keywords conocidas.
 * Para CSV: usa la primera fila como headers.
 */

import * as XLSX from "xlsx"

export type ParsedSheet = {
  name: string
  headers: string[]
  rows: string[][] // cada fila es un array de strings
}

/**
 * Parsea un File (xlsx, csv, tsv) y devuelve las hojas con headers + datos.
 */
export async function parseFile(file: File): Promise<ParsedSheet[]> {
  const ext = file.name.split(".").pop()?.toLowerCase()
  const buffer = await file.arrayBuffer()

  if (ext === "csv" || ext === "tsv") {
    return parseCSVBuffer(buffer, ext === "tsv" ? "\t" : ",", file.name)
  }

  return parseExcelBuffer(buffer)
}

function parseCSVBuffer(buffer: ArrayBuffer, separator: string, fileName: string): ParsedSheet[] {
  const text = new TextDecoder("utf-8").decode(buffer)
  const lines = text.split(/\r?\n/).filter((l) => l.trim())

  if (lines.length < 2) return []

  const headers = splitCSVLine(lines[0], separator)
  const rows = lines.slice(1).map((line) => splitCSVLine(line, separator))

  return [{ name: fileName.replace(/\.\w+$/, ""), headers, rows }]
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/**
 * Para Excel: busca la fila que contiene headers de tabla de parcelas.
 * Keywords: "municipio", "referencia", "catastral", "superficie", "parcela", "polígono"
 */
const HEADER_KEYWORDS = [
  "municipio", "referencia", "catastral", "superficie", "parcela",
  "poligono", "polígono", "propietario", "owner", "ref",
]

function parseExcelBuffer(buffer: ArrayBuffer): ParsedSheet[] {
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheets: ParsedSheet[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
      rawNumbers: false,
    })

    if (raw.length < 2) continue

    // Find the header row by looking for known keywords
    let headerRowIdx = 0
    let maxMatches = 0

    for (let i = 0; i < Math.min(50, raw.length); i++) {
      const row = raw[i]
      if (!Array.isArray(row)) continue

      const matches = row.filter((cell) => {
        if (typeof cell !== "string" || !cell) return false
        const norm = cell.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        return HEADER_KEYWORDS.some((kw) => norm.includes(kw))
      }).length

      if (matches > maxMatches) {
        maxMatches = matches
        headerRowIdx = i
      }
    }

    // Need at least 2 keyword matches to consider it a header row
    if (maxMatches < 2) continue

    // Track original column indices for non-empty headers
    const headerRow = raw[headerRowIdx]
    const headerEntries: { index: number; name: string }[] = []
    for (let j = 0; j < headerRow.length; j++) {
      const name = String(headerRow[j] ?? "").trim()
      if (name) headerEntries.push({ index: j, name })
    }

    const headers = headerEntries.map((h) => h.name)
    if (headers.length < 2) continue

    // Data rows are after the header
    const dataRows: string[][] = []

    for (let i = headerRowIdx + 1; i < raw.length; i++) {
      const row = raw[i]
      if (!Array.isArray(row)) continue

      // Use original column indices to extract values aligned with headers
      const normalized = headerEntries.map((h) => String(row[h.index] ?? "").trim())

      const filledCount = normalized.filter((c) => c).length
      if (filledCount === 0) continue

      // Stop if we hit a section break (Notas, Resumen, Tareas, Entidades)
      const firstNonEmpty = normalized.find((c) => c)?.toLowerCase() ?? ""
      if (
        firstNonEmpty.startsWith("notas") || firstNonEmpty.startsWith("resumen") ||
        firstNonEmpty.startsWith("tareas") || firstNonEmpty.startsWith("entidades")
      ) {
        break
      }

      // Skip sparse rows (likely not data)
      if (filledCount < 2) continue

      dataRows.push(normalized)
    }

    if (dataRows.length > 0) {
      sheets.push({ name: sheetName, headers, rows: dataRows })
    }
  }

  return sheets
}

/**
 * Extrae metadata del proyecto desde un Excel (las primeras filas antes de la tabla).
 * Busca patrones como "Proyecto: nombre", o celdas que contengan keywords.
 */
export type ProjectMetadata = {
  name: string | null
  cluster: string | null
}

export function extractProjectMetadata(file: File, buffer: ArrayBuffer): ProjectMetadata {
  const ext = file.name.split(".").pop()?.toLowerCase()

  if (ext === "csv" || ext === "tsv") {
    // CSV no tiene metadata — usar nombre del archivo
    return { name: file.name.replace(/\.\w+$/, ""), cluster: null }
  }

  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { name: null, cluster: null }

  const sheet = workbook.Sheets[sheetName]
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: true,
    rawNumbers: false,
  })

  let name: string | null = sheetName
  let cluster: string | null = null

  // Scan first 20 rows for project metadata
  for (let i = 0; i < Math.min(20, raw.length); i++) {
    const row = raw[i]
    if (!Array.isArray(row)) continue

    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] ?? "").trim()
      const cellLower = cell.toLowerCase()

      // Look for "Proyecto" label → value is in adjacent cell (left, then right)
      if (cellLower === "proyecto" || cellLower === "project") {
        for (const offset of [-1, -2, -3, 1, 2]) {
          const k = j + offset
          if (k < 0 || k >= row.length) continue
          const val = String(row[k] ?? "").trim()
          if (val && !val.startsWith("<") && val.length > 2) {
            name = val
            break
          }
        }
      }

      // Look for "Cluster" label
      if (cellLower === "cluster") {
        for (const offset of [-1, -2, -3, 1, 2]) {
          const k = j + offset
          if (k < 0 || k >= row.length) continue
          const val = String(row[k] ?? "").trim()
          if (val && !val.startsWith("<") && val.length > 1) {
            cluster = val
            break
          }
        }
      }
    }
  }

  return { name, cluster }
}
