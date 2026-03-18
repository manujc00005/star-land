import { z } from "zod"

/**
 * Validación de parcela catastral.
 *
 * geometry se valida por separado con parseGeoJSONString (geojson.ts)
 * para no mezclar la validación estructural GeoJSON con la del formulario.
 * Este schema cubre solo los campos escalares del modelo Parcel.
 */
export const parcelSchema = z.object({
  cadastralRef: z
    .string()
    .min(1, "La referencia catastral es obligatoria")
    .max(50)
    .transform((s) => s.trim()),
  polygon: z
    .string()
    .min(1, "El polígono es obligatorio")
    .max(50)
    .transform((s) => s.trim()),
  parcelNumber: z
    .string()
    .min(1, "El número de parcela es obligatorio")
    .max(50)
    .transform((s) => s.trim()),
  // coerce convierte el string del formulario a número
  surface: z.coerce
    .number()
    .positive("La superficie debe ser mayor que 0"),
  landUse: z
    .string()
    .max(200)
    .optional()
    .transform((v) => v?.trim() || null),
})

export type ParcelFormInput = z.infer<typeof parcelSchema>
