/**
 * Capa de abstracción GIS — operaciones espaciales sobre GeoJSON.
 *
 * Usa Turf.js para cálculos en servidor (MVP).
 * Para escalar, reemplaza las implementaciones por PostGIS ST_* manteniendo
 * las mismas firmas de función.
 *
 * Función elegida: booleanIntersects
 *   Devuelve true si las dos geometrías comparten cualquier punto.
 *   Cubre: contención total, intersección parcial, contacto en borde.
 *   booleanOverlap NO sirve aquí porque excluye la contención total
 *   (parcela completamente dentro del recinto del proyecto).
 */

import { booleanIntersects } from "@turf/turf"
import type { GeoJSONGeometry } from "@/lib/validations/geojson"

/**
 * Comprueba si dos geometrías GeoJSON se intersectan.
 * Acepta Polygon y MultiPolygon.
 *
 * @returns true si comparten espacio; false si son disjuntas o hay error.
 */
export function geometriesIntersect(
  geom1: GeoJSONGeometry,
  geom2: GeoJSONGeometry
): boolean {
  // La cast a any es segura: las geometrías ya han sido validadas con Zod
  // antes de llegar aquí. El tipo interno de Turf es compatible con GeoJSON spec.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return booleanIntersects(geom1 as any, geom2 as any)
}
