"use client"

import { useActionState, useCallback } from "react"
import { analyzeCSVAction, importParcelsAction } from "@/actions/parcel-import"
import { CSVUploadForm } from "@/components/parcels/import/csv-upload-form"
import { ImportPreview } from "@/components/parcels/import/import-preview"
import { ImportResultView } from "@/components/parcels/import/import-result"

/**
 * Página de importación CSV de parcelas.
 *
 * Flujo en 3 pasos gestionado con dos useActionState independientes:
 *   1. Subir CSV → analyzeCSVAction → preview (AnalyzeState)
 *   2. Confirmar → importParcelsAction → resultado (ImportState)
 *   3. Ver resumen y navegar
 *
 * El "Volver" del step 2 no necesita un action: simplemente recarga la página
 * o resetea el estado local — usamos un reload limpio.
 */
export default function ImportPage() {
  const [analyzeState, analyzeAction, analyzePending] = useActionState(
    analyzeCSVAction,
    null
  )
  const [importState, importAction, importPending] = useActionState(
    importParcelsAction,
    null
  )

  // "Volver" desde preview: recarga la página para empezar de cero
  const handleReset = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Importar parcelas desde CSV
          </h1>
          <p className="text-muted-foreground">
            Sube un archivo CSV con datos catastrales para importarlos en bloque
          </p>
        </div>
        <a
          href="/demo-parcelas.csv"
          download
          className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground transition-colors"
        >
          Descargar CSV de demo
        </a>
      </div>

      {/* ── Step 3: Resultado ──────────────────────────────────────────────── */}
      {importState?.phase === "done" && (
        <ImportResultView result={importState.result} />
      )}

      {/* Error del import (inesperado) */}
      {importState?.phase === "error" && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-lg">
          {importState.error}
        </div>
      )}

      {/* ── Step 2: Preview ────────────────────────────────────────────────── */}
      {!importState && analyzeState?.phase === "preview" && (
        <ImportPreview
          parseResult={analyzeState.parseResult}
          importAction={importAction}
          importPending={importPending}
          onReset={handleReset}
        />
      )}

      {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
      {!importState && analyzeState?.phase !== "preview" && (
        <CSVUploadForm
          action={analyzeAction}
          isPending={analyzePending}
          error={
            analyzeState?.phase === "error" ? analyzeState.error : undefined
          }
        />
      )}
    </div>
  )
}
