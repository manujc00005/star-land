/**
 * Generador de KML para proyectos StarLand.
 *
 * Responsabilidad: construir el string KML completo a partir de datos
 * ya resueltos (sin queries propias). El caller obtiene los datos;
 * este módulo solo formatea.
 *
 * Estructura del KML generado:
 *   Document
 *     Styles (proyecto, parcela con contrato, parcela sin contrato)
 *     Folder "Proyecto"  → Placemark del recinto
 *     Folder "Parcelas"  → un Placemark por parcela con geometry válida
 *
 * Preparado para ampliarse con más capas (subestaciones, líneas, etc.)
 * sin tocar la lógica de conversión geométrica (geometry.ts).
 */

import { geojsonGeometrySchema } from "@/lib/validations/geojson"
import { TYPE_LABELS, STATUS_LABELS as CONTRACT_STATUS_LABELS } from "@/lib/validations/contract"
import { PROJECT_STATUS_LABELS } from "@/lib/validations/project"
import { geoJsonToKmlGeometry } from "./geometry"

// ── Tipos públicos ─────────────────────────────────────────────────────────────

export type KmlContractData = {
  type: string
  status: string
  price: number | null
  signedAt: Date | null
  owner: { name: string; nif: string }
}

export type KmlParcelData = {
  cadastralRef: string
  polygon: string
  parcelNumber: string
  surface: number
  landUse: string | null
  geometry: unknown
  contracts: KmlContractData[]
}

export type KmlProjectData = {
  project: {
    name: string
    powerMW: number | null
    status: string
    geometry: unknown
  }
  parcels: KmlParcelData[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Escapa caracteres especiales XML para uso fuera de secciones CDATA. */
function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Evita que el contenido HTML rompa la sección CDATA si contiene ']]>'.
 * En la práctica nunca ocurre con datos catastrales, pero es una buena práctica.
 */
function safeCdata(str: string): string {
  return String(str ?? "").replace(/]]>/g, "]]&gt;")
}

/** Parsea el campo Json? de Prisma y lo convierte a KML. Devuelve null si falla. */
function parseAndConvertGeometry(raw: unknown): string | null {
  if (!raw) return null
  const result = geojsonGeometrySchema.safeParse(raw)
  if (!result.success) return null
  return geoJsonToKmlGeometry(result.data)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// ── Estilos KML ────────────────────────────────────────────────────────────────
// Colores en formato KML ABGR (alpha, blue, green, red):
//   Azul  (#0000FF): ffff0000  |  Azul semitransparente: 33ff0000
//   Verde (#00FF00): ff00ff00  |  Verde semitransparente: 2000ff00
//   Amarillo (#FFFF00): ff00ffff | Amarillo semitransparente: 2000ffff

function buildStyles(): string {
  return `
  <Style id="projectStyle">
    <LineStyle><color>ffff0000</color><width>3</width></LineStyle>
    <PolyStyle><color>33ff0000</color></PolyStyle>
  </Style>
  <Style id="parcelContractStyle">
    <LineStyle><color>ff00ff00</color><width>2</width></LineStyle>
    <PolyStyle><color>2000ff00</color></PolyStyle>
  </Style>
  <Style id="parcelNoContractStyle">
    <LineStyle><color>ff00ffff</color><width>1.5</width></LineStyle>
    <PolyStyle><color>2000ffff</color></PolyStyle>
  </Style>`
}

// ── Builders de descripción (HTML en CDATA) ───────────────────────────────────

function buildProjectDescription(
  project: KmlProjectData["project"],
  parcelCount: number
): string {
  const statusLabel =
    PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] ??
    project.status

  const lines = [
    `<b>Proyecto:</b> ${safeCdata(project.name)}`,
    project.powerMW != null ? `<b>Potencia:</b> ${project.powerMW} MW` : null,
    `<b>Estado:</b> ${safeCdata(statusLabel)}`,
    `<b>Parcelas vinculadas:</b> ${parcelCount}`,
    `<b>Exportado:</b> ${formatDate(new Date())}`,
  ]

  return `<![CDATA[${lines.filter(Boolean).join("<br>")}]]>`
}

function buildContractBlock(contracts: KmlContractData[]): string {
  if (contracts.length === 0) {
    return "<b>Sin contrato asociado</b>"
  }

  const c = contracts[0]
  const typeLabel =
    TYPE_LABELS[c.type as keyof typeof TYPE_LABELS] ?? c.type
  const statusLabel =
    CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS] ??
    c.status
  const price = c.price != null ? `${c.price.toLocaleString("es-ES")} €` : "—"
  const signed = c.signedAt ? formatDate(c.signedAt) : "—"

  const lines = [
    "<b>── CONTRATO ──</b>",
    `<b>Tipo:</b> ${safeCdata(typeLabel)}`,
    `<b>Estado:</b> ${safeCdata(statusLabel)}`,
    `<b>Precio:</b> ${price}`,
    `<b>Firmado:</b> ${signed}`,
    "",
    "<b>── PROPIETARIO ──</b>",
    `<b>Nombre:</b> ${safeCdata(c.owner.name)}`,
    `<b>NIF:</b> ${safeCdata(c.owner.nif)}`,
  ]

  if (contracts.length > 1) {
    lines.push(`<i>+ ${contracts.length - 1} contrato(s) adicional(es)</i>`)
  }

  return lines.join("<br>")
}

function buildParcelDescription(parcel: KmlParcelData): string {
  const surface = parcel.surface.toLocaleString("es-ES")
  const landUse = parcel.landUse ?? "—"

  const dataLines = [
    `<b>Ref. Catastral:</b> ${safeCdata(parcel.cadastralRef)}`,
    `<b>Polígono:</b> ${safeCdata(parcel.polygon)} &nbsp;|&nbsp; <b>Parcela:</b> ${safeCdata(parcel.parcelNumber)}`,
    `<b>Superficie:</b> ${surface} m²`,
    `<b>Uso del suelo:</b> ${safeCdata(landUse)}`,
    "<hr>",
    buildContractBlock(parcel.contracts),
  ]

  return `<![CDATA[${dataLines.join("<br>")}]]>`
}

// ── Builders de Placemark ──────────────────────────────────────────────────────

function buildProjectPlacemark(
  project: KmlProjectData["project"],
  parcelCount: number
): string {
  const kmlGeometry = parseAndConvertGeometry(project.geometry)
  const description = buildProjectDescription(project, parcelCount)

  return `
    <Placemark>
      <name>${escapeXml(project.name)}</name>
      <description>${description}</description>
      <styleUrl>#projectStyle</styleUrl>
      ${kmlGeometry ?? "<!-- Sin geometría definida -->"}
    </Placemark>`
}

function buildParcelPlacemark(parcel: KmlParcelData): string | null {
  const kmlGeometry = parseAndConvertGeometry(parcel.geometry)
  if (!kmlGeometry) return null // parcela sin geometry válida → se omite silenciosamente

  const hasContract = parcel.contracts.length > 0
  const styleUrl = hasContract ? "#parcelContractStyle" : "#parcelNoContractStyle"
  const description = buildParcelDescription(parcel)

  return `
    <Placemark>
      <name>${escapeXml(parcel.cadastralRef)}</name>
      <description>${description}</description>
      <styleUrl>${styleUrl}</styleUrl>
      ${kmlGeometry}
    </Placemark>`
}

// ── Función principal ──────────────────────────────────────────────────────────

/**
 * Genera el KML completo de un proyecto como string XML.
 * No hace queries — todos los datos deben venir ya resueltos en `data`.
 */
export function generateProjectKml(data: KmlProjectData): string {
  const { project, parcels } = data

  const parcelPlacemarks = parcels
    .map(buildParcelPlacemark)
    .filter((p): p is string => p !== null)
    .join("")

  const skipped = parcels.length - parcelPlacemarks.split("<Placemark>").length + 1

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(project.name)}</name>
    <description><![CDATA[Exportado desde StarLand · ${formatDate(new Date())}]]></description>
    ${buildStyles()}

    <Folder>
      <name>Proyecto</name>
      <description><![CDATA[Recinto del proyecto]]></description>
      ${buildProjectPlacemark(project, parcels.length)}
    </Folder>

    <Folder>
      <name>Parcelas (${parcels.length})</name>
      <description><![CDATA[Parcelas vinculadas al proyecto${skipped > 0 ? ` · ${skipped} sin geometría omitidas` : ""}]]></description>
      ${parcelPlacemarks || "<!-- Sin parcelas con geometría -->"}
    </Folder>
  </Document>
</kml>`
}
