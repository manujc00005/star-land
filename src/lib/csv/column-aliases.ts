/**
 * Normalización y detección de cabeceras CSV para importación de parcelas.
 *
 * El diseño es genérico a propósito: detectHeaders() y normalizeHeader()
 * pueden reutilizarse para futuros importadores (owners, contracts, etc.)
 * cambiando solo el FIELD_ALIASES y los REQUIRED_FIELDS.
 */

// Maps normalized header → canonical field name
const FIELD_ALIASES: Record<string, string> = {
  // ── cadastralRef ────────────────────────────────────────────────────────────
  cadastralref: "cadastralRef",
  cadastral_ref: "cadastralRef",
  cadastralreference: "cadastralRef",
  referencia_catastral: "cadastralRef",
  ref_catastral: "cadastralRef",
  refcat: "cadastralRef",
  referencia: "cadastralRef",

  // ── polygon ─────────────────────────────────────────────────────────────────
  polygon: "polygon",
  poligono: "polygon",
  pol: "polygon",
  poligono_catastral: "polygon",

  // ── parcelNumber ─────────────────────────────────────────────────────────────
  parcelnumber: "parcelNumber",
  parcel_number: "parcelNumber",
  parcela: "parcelNumber",
  num_parcela: "parcelNumber",
  numero_parcela: "parcelNumber",
  numparcela: "parcelNumber",
  numero: "parcelNumber",
  num: "parcelNumber",

  // ── surface ──────────────────────────────────────────────────────────────────
  surface: "surface",
  area: "surface",
  superficie: "surface",
  m2: "surface",
  metros: "surface",
  metros_cuadrados: "surface",
  superficie_m2: "surface",

  // ── landUse ──────────────────────────────────────────────────────────────────
  landuse: "landUse",
  land_use: "landUse",
  uso: "landUse",
  uso_del_suelo: "landUse",
  uso_suelo: "landUse",
  usosuelo: "landUse",
  clasificacion: "landUse",

  // ── geometry ─────────────────────────────────────────────────────────────────
  geometry: "geometry",
  geojson: "geometry",
  geometria: "geometry",
  geo: "geometry",
  geom: "geometry",
}

const REQUIRED_FIELDS = [
  "cadastralRef",
  "polygon",
  "parcelNumber",
  "surface",
] as const

/**
 * Normaliza un string de cabecera para comparación tolerante:
 * - minúsculas
 * - sin acentos
 * - espacios → guión bajo
 * - solo alfanumérico + guión bajo
 */
export function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

type FieldName = "cadastralRef" | "polygon" | "parcelNumber" | "surface" | "landUse" | "geometry"

/**
 * Dado un array de nombres de cabecera originales (tal como vienen del CSV),
 * retorna un mapa de campo canónico → nombre de cabecera original.
 *
 * Si hay cabeceras extra desconocidas, se ignoran.
 * Si hay cabeceras requeridas que faltan, se incluyen en `missing`.
 */
export function detectHeaders(originalHeaders: string[]): {
  mapping: Partial<Record<FieldName, string>>
  missing: string[]
} {
  const mapping: Partial<Record<FieldName, string>> = {}

  for (const header of originalHeaders) {
    const normalized = normalizeHeader(header)
    const field = FIELD_ALIASES[normalized] as FieldName | undefined
    if (field && !mapping[field]) {
      mapping[field] = header // keep original name for row access
    }
  }

  const missing = REQUIRED_FIELDS.filter((f) => !mapping[f])

  return { mapping, missing }
}
