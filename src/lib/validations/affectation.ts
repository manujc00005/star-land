// Catálogo de afecciones de parcela en un proyecto.
// Texto libre en BD — este array es el catálogo UI, no una restricción de BD.
// Ampliar aquí sin migration.

export const AFFECTATION_OPTIONS = [
  "Planta",
  "Aerogenerador",
  "Línea de alta tensión",
  "Subestación",
  "Baterías",
  "Vial de acceso",
  "Otra",
] as const

export type AffectationOption = (typeof AFFECTATION_OPTIONS)[number]
