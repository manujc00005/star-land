/**
 * Sistema de matching inteligente de columnas para importación de proyectos.
 *
 * Soporta aliases en español/inglés, normalización de acentos,
 * y matching por similitud para nombres no exactos.
 */

// ── Campos canónicos del sistema ──────────────────────────────────────────────

export type ImportField =
  | "municipio"
  | "poligono"
  | "parcela"
  | "refCatastral"
  | "superficie"
  | "propietario"
  | "nifPropietario"
  | "estadoNegociacion"
  | "email"
  | "telefono"
  | "notas"
  | "skip"

export const IMPORT_FIELDS: Record<ImportField, { label: string; required: boolean }> = {
  municipio:          { label: "Municipio",            required: false },
  poligono:           { label: "Polígono",             required: false },
  parcela:            { label: "Parcela",              required: false },
  refCatastral:       { label: "Ref. Catastral",       required: true },
  superficie:         { label: "Superficie (m²)",      required: true },
  propietario:        { label: "Nombre Propietario",   required: false },
  nifPropietario:     { label: "NIF Propietario",      required: false },
  estadoNegociacion:  { label: "Estado Negociación",   required: false },
  email:              { label: "Email",                required: false },
  telefono:           { label: "Teléfono",             required: false },
  notas:              { label: "Notas",                required: false },
  skip:               { label: "— No importar —",      required: false },
}

// ── Aliases de columnas (clave = normalizado, valor = campo canónico) ─────────

const ALIASES: Record<string, ImportField> = {
  // Municipio
  municipio: "municipio",
  municipality: "municipio",
  termino_municipal: "municipio",
  localidad: "municipio",
  poblacion: "municipio",
  ciudad: "municipio",

  // Polígono
  poligono: "poligono",
  polygon: "poligono",
  pol: "poligono",
  poligono_catastral: "poligono",

  // Parcela
  parcela: "parcela",
  parcel: "parcela",
  parcelnumber: "parcela",
  parcel_number: "parcela",
  num_parcela: "parcela",
  numero_parcela: "parcela",
  numero: "parcela",

  // Ref. Catastral
  referencia_catastral: "refCatastral",
  ref_catastral: "refCatastral",
  refcat: "refCatastral",
  cadastralref: "refCatastral",
  cadastral_ref: "refCatastral",
  referencia: "refCatastral",
  ref: "refCatastral",

  // Superficie
  superficie: "superficie",
  superficie_m2: "superficie",
  surface: "superficie",
  area: "superficie",
  m2: "superficie",
  metros_cuadrados: "superficie",
  metros: "superficie",
  hectareas: "superficie",
  ha: "superficie",

  // Propietario
  nombre_propietario: "propietario",
  propietario: "propietario",
  owner: "propietario",
  owner_name: "propietario",
  titular: "propietario",
  nombre: "propietario",
  nombre_titular: "propietario",

  // NIF
  nif: "nifPropietario",
  nie: "nifPropietario",
  nif_nie: "nifPropietario",
  nif_propietario: "nifPropietario",
  cif: "nifPropietario",
  dni: "nifPropietario",

  // Estado Negociación
  estado_negociacion: "estadoNegociacion",
  estado_contratacion: "estadoNegociacion",
  estado: "estadoNegociacion",
  status: "estadoNegociacion",
  negotiation_status: "estadoNegociacion",

  // Email
  email: "email",
  correo: "email",
  correo_electronico: "email",
  mail: "email",

  // Teléfono
  telefono: "telefono",
  phone: "telefono",
  tel: "telefono",
  movil: "telefono",
  celular: "telefono",

  // Notas
  notas: "notas",
  notes: "notas",
  observaciones: "notas",
  comentarios: "notas",
}

/**
 * Normaliza un header para matching: lowercase, sin acentos, solo alfanumérico + _
 */
export function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

export type ColumnMapping = {
  /** Index de la columna en el archivo original */
  index: number
  /** Header original del archivo */
  originalHeader: string
  /** Campo asignado (auto-detectado o manual) */
  field: ImportField
  /** Confianza del match: "exact" | "fuzzy" | "manual" | "none" */
  confidence: "exact" | "fuzzy" | "none"
}

/**
 * Dado un array de headers originales, intenta mapear cada uno al campo canónico.
 */
export function autoMapColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header, index) => {
    const normalized = normalizeHeader(header)

    // 1. Exact alias match
    if (ALIASES[normalized]) {
      return { index, originalHeader: header, field: ALIASES[normalized], confidence: "exact" as const }
    }

    // 2. Partial match: check if any alias is contained in the header or vice versa
    for (const [alias, field] of Object.entries(ALIASES)) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        if (normalized.length > 2 && alias.length > 2) {
          return { index, originalHeader: header, field, confidence: "fuzzy" as const }
        }
      }
    }

    return { index, originalHeader: header, field: "skip" as ImportField, confidence: "none" as const }
  })
}

// ── Mapeo de estados de negociación del cliente → nuestro enum ────────────────

const NEGOTIATION_MAP: Record<string, string> = {
  buscando: "SEARCHING",
  busqueda: "SEARCHING",
  searching: "SEARCHING",
  negociando: "NEGOTIATING",
  en_negociacion: "NEGOTIATING",
  negotiating: "NEGOTIATING",
  aceptado: "ACCEPTED",
  acuerdo_verbal: "ACCEPTED",
  accepted: "ACCEPTED",
  firmado: "SIGNED",
  signed: "SIGNED",
  no_negocia: "NOT_NEGOTIATING",
  not_negotiating: "NOT_NEGOTIATING",
  competencia: "COMPETITION",
  competition: "COMPETITION",
  duplicado: "DUPLICATE",
  duplicate: "DUPLICATE",
  cerrado: "TERMINATED",
  terminado: "TERMINATED",
  terminated: "TERMINATED",
  contrato_rescindido: "TERMINATED",
  rescindido: "TERMINATED",
}

export function mapNegotiationStatus(raw: string): string {
  const normalized = normalizeHeader(raw)
  return NEGOTIATION_MAP[normalized] ?? "SEARCHING"
}
