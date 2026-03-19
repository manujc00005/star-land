// ── Estado de negociación por proyecto-parcela ─────────────────────────────────
// Estado operativo: refleja el avance de la negociación en el contexto del proyecto.
// Independiente de Contract.status (estado legal del contrato).

export const NEGOTIATION_STATUSES = [
  "SEARCHING",
  "NEGOTIATING",
  "ACCEPTED",
  "SIGNED",
  "NOT_NEGOTIATING",
  "COMPETITION",
  "DUPLICATE",
  "TERMINATED",
] as const

export type NegotiationStatus = (typeof NEGOTIATION_STATUSES)[number]

export const NEGOTIATION_STATUS_LABELS: Record<NegotiationStatus, string> = {
  SEARCHING:       "Buscando",
  NEGOTIATING:     "En negociación",
  ACCEPTED:        "Acuerdo verbal",
  SIGNED:          "Firmado",
  NOT_NEGOTIATING: "No negocia",
  COMPETITION:     "Competencia",
  DUPLICATE:       "Duplicado",
  TERMINATED:      "Cerrado",
}

export const NEGOTIATION_STATUS_STYLES: Record<
  NegotiationStatus,
  { label: string; className: string }
> = {
  SEARCHING:       { label: "Buscando",       className: "bg-slate-100 text-slate-500" },
  NEGOTIATING:     { label: "En negociación", className: "bg-blue-100 text-blue-700" },
  ACCEPTED:        { label: "Acuerdo verbal", className: "bg-amber-100 text-amber-700" },
  SIGNED:          { label: "Firmado",        className: "bg-green-100 text-green-700" },
  NOT_NEGOTIATING: { label: "No negocia",     className: "bg-red-100 text-red-600" },
  COMPETITION:     { label: "Competencia",    className: "bg-purple-100 text-purple-700" },
  DUPLICATE:       { label: "Duplicado",      className: "bg-orange-100 text-orange-600" },
  TERMINATED:      { label: "Cerrado",        className: "bg-zinc-100 text-zinc-500" },
}
