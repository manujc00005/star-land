"use client"

import { useState, useTransition, useActionState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, X, Trash2 } from "lucide-react"
import { updateParcelNotesAction } from "@/actions/project-parcel"
import {
  createParcelContactAction,
  deleteParcelContactAction,
  type ContactActionState,
} from "@/actions/parcel-contact"
import { CONTACT_ROLES } from "@/lib/validations/parcel-contact"
import type { ContractStatus, ContractType } from "@/lib/validations/contract"
import type { TabContact } from "@/components/projects/project-tabs"

type Props = {
  projectParcelId: string
  projectId: string
  parcelId: string
  notes: string | null
  contacts: TabContact[]
  ownerName: string | null
  ownerId: string | null
  contractStatus: ContractStatus | null
  contractType: ContractType | null
  contractId: string | null
}

export function ParcelPanel({
  projectParcelId,
  projectId,
  parcelId,
  notes: initialNotes,
  contacts,
  ownerName,
  ownerId,
  contractStatus,
  contractType,
  contractId,
}: Props) {
  // ── Notas ────────────────────────────────────────────────────────────────────
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

  // ── Añadir contacto ───────────────────────────────────────────────────────
  const [showAddContact, setShowAddContact] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const boundCreate = createParcelContactAction.bind(null, parcelId, projectId)
  const [contactState, contactAction, contactPending] = useActionState<
    ContactActionState,
    FormData
  >(boundCreate, {})

  const prevContactState = useRef<ContactActionState | null>(null)
  useEffect(() => {
    // On successful submit (state changes and no error), close + reset form
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

  return (
    <div className="grid gap-6 lg:grid-cols-3 text-sm">
      {/* ── Col 1: Notas de contratación ────────────────────────────────────── */}
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

      {/* ── Col 2: Propietario y contrato ────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Propietario y contrato
        </p>
        {ownerName && ownerId ? (
          <div className="space-y-1.5">
            <div>
              <span className="text-muted-foreground text-xs">Propietario: </span>
              <Link
                href={`/owners/${ownerId}`}
                className="hover:underline underline-offset-4"
              >
                {ownerName}
              </Link>
            </div>
            {contractId && contractStatus && (
              <div>
                <span className="text-muted-foreground text-xs">Contrato: </span>
                <Link
                  href={`/contracts/${contractId}`}
                  className="hover:underline underline-offset-4"
                >
                  {contractType === "RENTAL" ? "Arrendamiento" : "Compraventa"} ·{" "}
                  {contractStatus === "ACTIVE"
                    ? "Activo"
                    : contractStatus === "DRAFT"
                    ? "En negociación"
                    : "Expirado"}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">Sin propietario registrado.</p>
        )}
      </div>

      {/* ── Col 3: Personas relacionadas ────────────────────────────────────── */}
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
