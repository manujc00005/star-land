import { z } from "zod"

/**
 * Validación estructural de GeoJSON.
 *
 * Tipos soportados: Polygon, MultiPolygon.
 * Validación matemática (cierre de anillos, winding order) se añadirá
 * cuando se integre una librería GIS como Turf.js.
 *
 * Diseñado para ser la única fuente de verdad al almacenar geometry
 * en el campo Json? de Project. Cuando se migre a PostGIS, este schema
 * seguirá siendo válido como capa de validación de aplicación.
 */

// [longitude, latitude] — o [lon, lat, elevation] según spec GeoJSON
const positionSchema = z
  .array(z.number())
  .min(2, "Una posición debe tener al menos longitud y latitud")

// Un anillo lineal necesita mínimo 4 puntos (último == primero)
const linearRingSchema = z
  .array(positionSchema)
  .min(4, "Un anillo lineal debe tener al menos 4 posiciones")

// Coordenadas de un Polygon: [exterior, ...huecos]
const polygonCoordinatesSchema = z
  .array(linearRingSchema)
  .min(1, "Un Polygon debe tener al menos un anillo exterior")

export const polygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: polygonCoordinatesSchema,
})

export const multiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z
    .array(polygonCoordinatesSchema)
    .min(1, "Un MultiPolygon debe tener al menos un Polygon"),
})

// Schema principal — usar este en validaciones y server actions
export const geojsonGeometrySchema = z.discriminatedUnion("type", [
  polygonSchema,
  multiPolygonSchema,
])

export type GeoJSONGeometry = z.infer<typeof geojsonGeometrySchema>

/**
 * Parsea y valida un string JSON como GeoJSON geometry.
 * Retorna el objeto validado o un mensaje de error legible.
 */
export function parseGeoJSONString(
  raw: string
): { ok: true; data: GeoJSONGeometry } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      ok: false,
      error: "JSON no válido. Revisa la sintaxis (comillas, comas, llaves).",
    }
  }

  const result = geojsonGeometrySchema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, error: result.error.issues[0].message }
  }

  return { ok: true, data: result.data }
}
