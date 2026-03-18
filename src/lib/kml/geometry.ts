/**
 * Conversión de geometrías GeoJSON a elementos KML.
 *
 * GeoJSON usa [longitud, latitud] — igual que KML (lon,lat,alt).
 * No se requiere intercambio de ejes.
 *
 * Tipos soportados: Polygon, MultiPolygon.
 * Tipos no soportados devuelven null — el caller decide qué hacer.
 */

type Position = number[]
type LinearRing = Position[]
type PolygonCoords = LinearRing[]
type MultiPolygonCoords = PolygonCoords[]

function ringToKmlCoordinates(ring: LinearRing): string {
  return ring.map((pos) => `${pos[0]},${pos[1]},0`).join(" ")
}

function polygonCoordsToKml(coords: PolygonCoords): string {
  const [outer, ...holes] = coords
  if (!outer?.length) return ""

  const outerBoundary = [
    "<outerBoundaryIs>",
    "<LinearRing>",
    "<tessellate>1</tessellate>",
    `<coordinates>${ringToKmlCoordinates(outer)}</coordinates>`,
    "</LinearRing>",
    "</outerBoundaryIs>",
  ].join("")

  const innerBoundaries = holes
    .map(
      (hole) =>
        `<innerBoundaryIs><LinearRing><tessellate>1</tessellate><coordinates>${ringToKmlCoordinates(hole)}</coordinates></LinearRing></innerBoundaryIs>`
    )
    .join("")

  return `<Polygon>${outerBoundary}${innerBoundaries}</Polygon>`
}

/**
 * Convierte una geometría GeoJSON (Polygon o MultiPolygon) al elemento
 * KML correspondiente (<Polygon> o <MultiGeometry>).
 *
 * Devuelve null si el tipo no está soportado o si los datos son inválidos.
 * Nunca lanza excepción — pensado para ser llamado dentro de try/catch del caller.
 */
export function geoJsonToKmlGeometry(geometry: {
  type: string
  coordinates: unknown
}): string | null {
  try {
    if (geometry.type === "Polygon") {
      return polygonCoordsToKml(geometry.coordinates as PolygonCoords)
    }

    if (geometry.type === "MultiPolygon") {
      const polygons = (geometry.coordinates as MultiPolygonCoords)
        .map(polygonCoordsToKml)
        .filter(Boolean)
        .join("")
      return polygons ? `<MultiGeometry>${polygons}</MultiGeometry>` : null
    }

    return null
  } catch {
    return null
  }
}
