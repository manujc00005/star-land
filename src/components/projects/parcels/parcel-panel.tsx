"use client"

import { useState, useTransition, useActionState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, X, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { updateParcelNotesAction, updateNegotiationStatusAction } from "@/actions/project-parcel"
import {
  createParcelContactAction,
  deleteParcelContactAction,
  type ContactActionState,
} from "@/actions/parcel-contact"
import {
  updateLinkedContractStatusAction,
  createPanelContractAction,
} from "@/actions/contract"
import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  STATUS_LABELS,
  TYPE_LABELS,
  type ContractStatus,
  type ContractType,
} from "@/lib/validations/contract"
import {
  NEGOTIATION_STATUSES,
  NEGOTIATION_STATUS_LABELS,
  type NegotiationStatus,
} from "@/lib/validations/negotiation-status"
import { CONTACT_ROLES } from "@/lib/validations/parcel-contact"
import type { TabContact, TabContract, PanelOwner } from "@/components/projects/project-tabs"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Props = {
  projectParcelId: string
  projectId: string
  parcelId: string
  notes: string | null
  negotiationStatus: NegotiationStatus
  contracts: TabContract[]
  contacts: TabContact[]
  owners: PanelOwner[]
}

// ── Componente principal ───────────────────────────────────────────────────────

export function ParcelPanel({
  projectParcelId,
  projectId,
  parcelId,
  notes: initialNotes,
  negotiationStatus: initialNegotiationStatus,
  contracts,
  contacts,
  owners,
}: Props) {
  // ── Col 1: Estado de negociación + Notas ──────────────────────────────────
  const [localNegStatus, setLocalNegStatus] = useState<NegotiationStatus>(
    initialNegotiationStatus
  )
  const [negPending, startNegTrans] = useTransition()
  const [negSaved, setNegSaved] = useState(false)

  useEffect(() => {
    setLocalNegStatus(initialNegotiationStatus)
  }, [initialNegotiationStatus])

  function saveNegotiationStatus() {
    startNegTrans(async () => {
      await updateNegotiationStatusAction(projectParcelId, projectId, localNegStatus)
      setNegSaved(true)
      setTimeout(() => setNegSaved(false), 2500)
    })
  }

  const [notes, setNotes] = useState(initialNotes ?? "")
  const [notesPending, startNotesTrans] = useTransition()
  const [notesSaved, setNotesSaved] = useState(false)

  function saveNotes() {
    startNotesTrans(async () => {
      await updateParcelNotesAction(projectParcelId, projectId, notes || null)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2500)
    })
  }

  // ── Col 2: Contratos ──────────────────────────────────────────────────────
  const activeContracts = contracts.filter((c) => c.status !== "EXPIRED")
  const expiredContracts = contracts.filter((c) => c.status === "EXPIRED")
  const [showExpired, setShowExpired] = useState(false)

  // Estado para actualizar contrato desde panel (solo si hay contratos activos/draft)
  const [editingContractId, setEditingContractId] = useState<string | null>(null)
  const editingContract = activeContracts.find((c) => c.id === editingContractId) ?? null
  const [localStatus, setLocalStatus] = useState<ContractStatus>(
    editingContract?.status ?? "DRAFT"
  )
  const [statusPending, startStatusTrans] = useTransition()
  const [statusSaved, setStatusSaved] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    if (editingContract) {
      setLocalStatus(editingContract.status)
      setStatusError(null)
    }
  }, [editingContract?.id, editingContract?.status])

  function saveContractStatus() {
    if (!editingContractId) return
    setStatusError(null)
    startStatusTrans(async () => {
      const result = await updateLinkedContractStatusAction(
        editingContractId,
        localStatus,
        projectId
      )
      if (result.error) {
        setStatusError(result.error)
      } else {
        setStatusSaved(true)
        setTimeout(() => setStatusSaved(false), 2500)
      }
    })
  }

  // ── Col 2: Crear contrato desde panel (cuando no hay contratos) ───────────
  const [selectedOwnerId, setSelectedOwnerId] = useState(owners[0]?.id ?? "")
  const [selectedType, setSelectedType] = useState<ContractType>("RENTAL")
  const [createPending, startCreateTrans] = useTransition()
  const [createError, setCreateError] = useState<string | null>(null)

  function handleCreateContract() {
    if (!selectedOwnerId) {
      setCreateError("Selecciona un propietario.")
      return
    }
    setCreateError(null)
    startCreateTrans(async () => {
      const result = await createPanelContractAction(
        parcelId,
        selectedOwnerId,
        selectedType,
        projectId
      )
      if (result.error) {
        setCreateError(result.error)
      }
    })
  }

  // ── Col 3: Añadir contacto ────────────────────────────────────────────────
  const [showAddContact, setShowAddContact] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const boundCreate = createParcelContactAction.bind(null, parcelId, projectId)
  const [contactState, contactAction, contactPending] = useActionState<
    ContactActionState,
    FormData
  >(boundCreate, {})

  const prevContactState = useRef<ContactActionState | null>(null)
  useEffect(() => {
    if (
      prevContactState.current !== null &&
      prevContactState.current !== contactState &&
      !contactState.error
    ) {
      setFormKey((k) => k + 1)
      setShowAddContact(false)
    }
    prevContactState.current = contactState
  }, [contactState])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6 lg:grid-cols-3 text-sm">

      {/* ── Col 1: Estado de negociación + Notas ──────────────────────────── */}
      <div className="space-y-4">
        {/* Estado de negociación */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Estado de negociación
          </p>
          <div className="flex items-center gap-2">
            <select
              value={localNegStatus}
              onChange={(e) => setLocalNegStatus(e.target.value as NegotiationStatus)}
              disabled={negPending}
              className="flex-1 h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              {NEGOTIATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {NEGOTIATION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={negPending || localNegStatus === initialNegotiationStatus}
              onClick={saveNegotiationStatus}
              className="shrink-0 h-8 text-xs px-2.5"
            >
              {negPending ? "…" : negSaved ? "✓" : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notas de contratación
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Añade notas sobre la negociación…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={notesPending}
            onClick={saveNotes}
          >
            {notesPending ? "Guardando…" : notesSaved ? "Guardado ✓" : "Guardar notas"}
          </Button>
        </div>
      </div>

      {/* ── Col 2: Contratos ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contratos
        </p>

        {contracts.length === 0 ? (
          // ── Sin contratos: formulario para crear contrato DRAFT ────────────
          <div className="space-y-3">
            {owners.length === 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  No hay propietarios registrados en tu organización.
                </p>
                <Link
                  href="/owners/new"
                  className="text-xs text-primary hover:underline underline-offset-4"
                >
                  Crear propietario →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Sin contratos. Crea un borrador para asignar propietario.
                </p>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Propietario</span>
                  <select
                    value={selectedOwnerId}
                    onChange={(e) => setSelectedOwnerId(e.target.value)}
                    disabled={createPending}
                    className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} · {o.nif}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Tipo de contrato</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as ContractType)}
                    disabled={createPending}
                    className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  >
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                {createError && (
                  <p className="text-xs text-destructive">{createError}</p>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={createPending || !selectedOwnerId}
                  onClick={handleCreateContract}
                  className="w-full"
                >
                  {createPending ? "Creando…" : "Crear contrato borrador"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          // ── Con contratos: lista con ACTIVE/DRAFT primero ──────────────────
          <div className="space-y-2">
            {/* Contratos ACTIVE y DRAFT */}
            {activeContracts.length > 0 && (
              <ul className="space-y-2">
                {activeContracts.map((c) => (
                  <ContractItem
                    key={c.id}
                    contract={c}
                    isEditing={editingContractId === c.id}
                    localStatus={editingContractId === c.id ? localStatus : c.status}
                    statusPending={statusPending}
                    statusSaved={statusSaved}
                    statusError={editingContractId === c.id ? statusError : null}
                    onToggleEdit={() => {
                      setEditingContractId((prev) => (prev === c.id ? null : c.id))
                      setStatusSaved(false)
                      setStatusError(null)
                    }}
                    onStatusChange={setLocalStatus}
                    onSaveStatus={saveContractStatus}
                    currentContractStatus={c.status}
                  />
                ))}
              </ul>
            )}

            {/* Contratos EXPIRED (colapsable) */}
            {expiredContracts.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setShowExpired((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showExpired ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {showExpired
                    ? "Ocultar expirados"
                    : `Ver contratos expirados (${expiredContracts.length})`}
                </button>
                {showExpired && (
                  <ul className="mt-2 space-y-2">
                    {expiredContracts.map((c) => (
                      <ContractItem
                        key={c.id}
                        contract={c}
                        isEditing={false}
                        localStatus={c.status}
                        statusPending={false}
                        statusSaved={false}
                        statusError={null}
                        onToggleEdit={() => {}}
                        onStatusChange={() => {}}
                        onSaveStatus={() => {}}
                        currentContractStatus={c.status}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Crear contrato adicional (si hay propietarios) */}
            {owners.length > 0 && (
              <CreateContractInline
                parcelId={parcelId}
                projectId={projectId}
                owners={owners}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Col 3: Personas relacionadas ──────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Personas relacionadas
          </p>
          <button
            className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
            onClick={() => setShowAddContact((v) => !v)}
          >
            {showAddContact ? (
              <>
                <X className="h-3 w-3" /> Cancelar
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" /> Añadir
              </>
            )}
          </button>
        </div>

        {contacts.length === 0 && !showAddContact && (
          <p className="text-muted-foreground text-xs">Sin contactos registrados.</p>
        )}

        <ul className="space-y-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2 group">
              <div className="min-w-0">
                <span className="font-medium">{c.name}</span>
                <span className="ml-1.5 text-muted-foreground text-xs">({c.role})</span>
                {c.phone && (
                  <div className="text-muted-foreground text-xs">{c.phone}</div>
                )}
                {c.email && (
                  <div className="text-muted-foreground text-xs">{c.email}</div>
                )}
                {c.notes && (
                  <div className="text-muted-foreground text-xs italic">{c.notes}</div>
                )}
              </div>
              <DeleteContactButton contactId={c.id} projectId={projectId} />
            </li>
          ))}
        </ul>

        {showAddContact && (
          <form key={formKey} action={contactAction} className="space-y-2 pt-2 border-t">
            {contactState.error && (
              <p className="text-xs text-destructive">{contactState.error}</p>
            )}
            <input
              name="name"
              placeholder="Nombre *"
              required
              className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <select
              name="role"
              required
              defaultValue=""
              className="w-full h-8 rounded border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>
                Rol *
              </option>
              {CONTACT_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="phone"
                placeholder="Teléfono"
                className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <textarea
              name="notes"
              placeholder="Notas internas"
              rows={2}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" type="submit" disabled={contactPending} className="w-full">
              {contactPending ? "Guardando…" : "Guardar contacto"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Sub-componente: fila de contrato ───────────────────────────────────────────

const STATUS_BADGE: Record<ContractStatus, string> = {
  DRAFT:           "bg-blue-100 text-blue-700",
  ACTIVE:          "bg-green-100 text-green-700",
  EXPIRED:         "bg-orange-100 text-orange-600",
  SIGNED_ADDENDUM: "bg-purple-100 text-purple-700",
}

function ContractItem({
  contract,
  isEditing,
  localStatus,
  statusPending,
  statusSaved,
  statusError,
  onToggleEdit,
  onStatusChange,
  onSaveStatus,
  currentContractStatus,
}: {
  contract: TabContract
  isEditing: boolean
  localStatus: ContractStatus
  statusPending: boolean
  statusSaved: boolean
  statusError: string | null
  onToggleEdit: () => void
  onStatusChange: (s: ContractStatus) => void
  onSaveStatus: () => void
  currentContractStatus: ContractStatus
}) {
  const isExpired = contract.status === "EXPIRED"

  return (
    <li className="rounded-md border border-border p-2.5 space-y-1.5">
      {/* Cabecera: propietario + tipo + estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <Link
            href={`/owners/${contract.owner.id}`}
            className="font-medium text-xs hover:underline underline-offset-4"
          >
            {contract.owner.name}
          </Link>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {TYPE_LABELS[contract.type]}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[contract.status]}`}
            >
              {STATUS_LABELS[contract.status]}
            </span>
            {contract.price != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {contract.price.toLocaleString("es-ES")} €
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/contracts/${contract.id}`}
          className="shrink-0 text-xs text-primary hover:underline underline-offset-4"
        >
          Ver →
        </Link>
      </div>

      {/* Editor de estado (solo para no-expirados) */}
      {!isExpired && (
        <>
          {isEditing ? (
            <div className="space-y-1.5 pt-1 border-t border-border">
              <div className="flex items-center gap-2">
                <select
                  value={localStatus}
                  onChange={(e) => onStatusChange(e.target.value as ContractStatus)}
                  disabled={statusPending}
                  className="flex-1 h-7 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  {CONTRACT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={statusPending || localStatus === currentContractStatus}
                  onClick={onSaveStatus}
                  className="shrink-0 h-7 text-xs px-2"
                >
                  {statusPending ? "…" : statusSaved ? "✓" : "OK"}
                </Button>
                <button
                  onClick={onToggleEdit}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {statusError && (
                <p className="text-xs text-destructive">{statusError}</p>
              )}
            </div>
          ) : (
            <button
              onClick={onToggleEdit}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cambiar estado
            </button>
          )}
        </>
      )}
    </li>
  )
}

// ── Sub-componente: crear contrato adicional ───────────────────────────────────

function CreateContractInline({
  parcelId,
  projectId,
  owners,
}: {
  parcelId: string
  projectId: string
  owners: PanelOwner[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState(owners[0]?.id ?? "")
  const [selectedType, setSelectedType] = useState<ContractType>("RENTAL")
  const [pending, startTrans] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handle() {
    if (!selectedOwnerId) { setError("Selecciona un propietario."); return }
    setError(null)
    startTrans(async () => {
      const result = await createPanelContractAction(parcelId, selectedOwnerId, selectedType, projectId)
      if (result.error) { setError(result.error) } else { setOpen(false) }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4 pt-1"
      >
        <Plus className="h-3 w-3" /> Añadir contrato
      </button>
    )
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Nuevo contrato</span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <select
        value={selectedOwnerId}
        onChange={(e) => setSelectedOwnerId(e.target.value)}
        disabled={pending}
        className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {owners.map((o) => (
          <option key={o.id} value={o.id}>{o.name} · {o.nif}</option>
        ))}
      </select>
      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value as ContractType)}
        disabled={pending}
        className="w-full h-8 rounded border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {CONTRACT_TYPES.map((t) => (
          <option key={t} value={t}>{TYPE_LABELS[t]}</option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button size="sm" variant="outline" disabled={pending || !selectedOwnerId} onClick={handle} className="w-full">
        {pending ? "Creando…" : "Crear borrador"}
      </Button>
    </div>
  )
}

// ── Sub-componente: botón eliminar contacto ────────────────────────────────────

function DeleteContactButton({
  contactId,
  projectId,
}: {
  contactId: string
  projectId: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteParcelContactAction(contactId, projectId)
        })
      }
      className="shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
      title="Eliminar contacto"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
