"use client"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Upload, FileText, X, ChevronDown, Loader2, CheckCircle2 } from "lucide-react"
import { IMPORT_MAX_ROWS } from "@/lib/csv/parcel-csv-parser"
import { cn } from "@/lib/utils"

const EXAMPLE_CSV = `cadastralRef,polygon,parcelNumber,surface,landUse,geometry
14001A00200001,001,0023,12500,Tierra de labor secano,
14001A00200002,001,0024,8750,Tierra de labor regadio,
14001A00200003,002,0001,3200,,`

const MAX_BYTES = 900 * 1024

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Props = {
  action: (formData: FormData) => void
  isPending: boolean
  error?: string
}

// Step indicator ──────────────────────────────────────────────────────────────

function StepIndicator({ active }: { active: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Analizar" },
    { n: 2, label: "Revisar" },
    { n: 3, label: "Importar" },
  ] as const

  return (
    <div className="flex items-center gap-0 text-xs font-medium">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center">
          {i > 0 && (
            <div
              className={cn(
                "h-px w-8 transition-colors",
                step.n <= active ? "bg-primary" : "bg-border"
              )}
            />
          )}
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
              step.n < active
                ? "bg-primary text-primary-foreground"
                : step.n === active
                  ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {step.n < active ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.n}
          </div>
          <span
            className={cn(
              "ml-1.5 transition-colors",
              step.n === active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// Main component ──────────────────────────────────────────────────────────────

export function CSVUploadForm({ action, isPending, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [formatOpen, setFormatOpen] = useState(false)

  function pickFile(picked: File | null | undefined) {
    if (!picked) return
    if (picked.size > MAX_BYTES) {
      setSizeError(`El archivo pesa ${formatBytes(picked.size)} — máximo 900 KB.`)
      setFile(null)
      return
    }
    setSizeError(null)
    setFile(picked)
    // Sync the hidden input so the FormData contains the file
    if (inputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(picked)
      inputRef.current.files = dt.files
    }
  }

  function clearFile() {
    setFile(null)
    setSizeError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    pickFile(e.dataTransfer.files[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function downloadExample() {
    const blob = new Blob([EXAMPLE_CSV], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ejemplo_parcelas.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const canSubmit = !!file && !isPending

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Step indicator */}
      <StepIndicator active={1} />

      {/* Upload card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Paso 1 — Analizar CSV</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecciona tu archivo. Validaremos las columnas y detectaremos duplicados
            sin guardar nada todavía.
          </p>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">

            {/* Global error from server */}
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Size validation error */}
            {sizeError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {sizeError}
              </p>
            )}

            {/* Drop zone — two states */}
            {file ? (
              /* ── File selected state ── */
              <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* ── Empty drop zone ── */
              <label
                htmlFor="file"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary hover:bg-muted/30"
                )}
              >
                <Upload className={cn("h-8 w-8 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="text-sm font-medium">
                    {isDragging ? "Suelta el archivo aquí" : "Arrastra un CSV o haz clic para seleccionar"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    .csv · máximo 900 KB
                  </p>
                </div>
              </label>
            )}

            {/* Hidden file input */}
            <input
              ref={inputRef}
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            {/* Submit */}
            <Button type="submit" disabled={!canSubmit} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando filas y buscando duplicados…
                </>
              ) : (
                "Analizar CSV"
              )}
            </Button>

            {isPending && (
              <p className="text-center text-xs text-muted-foreground animate-pulse">
                Esto puede tardar unos segundos con archivos grandes.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Format reference — collapsible */}
      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setFormatOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors rounded-lg"
        >
          <span>Formato esperado del CSV</span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", formatOpen && "rotate-180")}
          />
        </button>

        {formatOpen && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3">
            <div className="overflow-auto rounded-md bg-muted p-3">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 pr-4 text-left font-semibold">Campo</th>
                    <th className="py-1 pr-4 text-left font-semibold">Obligatorio</th>
                    <th className="py-1 text-left font-semibold">Alias aceptados</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-1 pr-4 text-foreground font-medium">cadastralRef</td>
                    <td className="py-1 pr-4">Sí</td>
                    <td className="py-1">cadastral_ref, refcat, referencia_catastral</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-4 text-foreground font-medium">polygon</td>
                    <td className="py-1 pr-4">Sí</td>
                    <td className="py-1">poligono, pol</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-4 text-foreground font-medium">parcelNumber</td>
                    <td className="py-1 pr-4">Sí</td>
                    <td className="py-1">parcel_number, parcela, num_parcela</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-4 text-foreground font-medium">surface</td>
                    <td className="py-1 pr-4">Sí</td>
                    <td className="py-1">superficie, area, m2</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 pr-4 text-foreground font-medium">landUse</td>
                    <td className="py-1 pr-4">No</td>
                    <td className="py-1">land_use, uso, uso_del_suelo</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 text-foreground font-medium">geometry</td>
                    <td className="py-1 pr-4">No</td>
                    <td className="py-1">geojson, geometria — GeoJSON Polygon/MultiPolygon</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Máximo {IMPORT_MAX_ROWS.toLocaleString("es-ES")} filas · Máximo 900 KB · Sin geometry: caben ~5.000 filas</span>
              <span>·</span>
              <button
                type="button"
                onClick={downloadExample}
                className="text-primary underline-offset-4 hover:underline"
              >
                Descargar CSV de ejemplo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
