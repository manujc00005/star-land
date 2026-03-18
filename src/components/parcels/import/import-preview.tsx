"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react"
import type { ParseResult } from "@/lib/csv/parcel-csv-parser"

const PREVIEW_ROWS = 8
const MAX_ERROR_ROWS = 15

type Props = {
  parseResult: ParseResult
  /** dispatch de useActionState — forma (formData: FormData) => void */
  importAction: (formData: FormData) => void
  importPending: boolean
  onReset: () => void
}

export function ImportPreview({
  parseResult,
  importAction,
  importPending,
  onReset,
}: Props) {
  const {
    totalRows,
    validRows,
    invalidRows,
    inCsvDuplicates,
    existingInDb,
    insertableRows,
  } = parseResult

  // Contexto serializado para el hidden input
  const context = JSON.stringify({
    totalCsvRows: totalRows,
    invalidCount: invalidRows.length,
    inCsvDupCount: inCsvDuplicates.length,
    rows: insertableRows,
  })

  const hasNothing = insertableRows.length === 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={onReset}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h2 className="text-lg font-semibold">Preview de importación</h2>
      </div>

      {/* ── Resumen ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del análisis</CardTitle>
          <CardDescription>
            {totalRows.toLocaleString("es-ES")} filas encontradas en el CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <StatBlock
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              label="Válidas"
              value={validRows.length}
              color="text-green-700"
            />
            <StatBlock
              icon={<XCircle className="h-4 w-4 text-destructive" />}
              label="Con errores"
              value={invalidRows.length}
              color="text-destructive"
            />
            <StatBlock
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
              label="Duplicadas en CSV"
              value={inCsvDuplicates.length}
              color="text-amber-700"
            />
            <StatBlock
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
              label="Ya en base de datos"
              value={existingInDb.length}
              color="text-amber-700"
            />
          </div>

          <div className="mt-4 rounded-md bg-muted px-4 py-3 text-sm font-medium">
            Se insertarán{" "}
            <span className="text-primary font-bold">
              {insertableRows.length}
            </span>{" "}
            parcelas nuevas
            {hasNothing && (
              <span className="text-muted-foreground font-normal ml-2">
                — no hay filas nuevas para importar
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Preview filas válidas ────────────────────────────────────────────── */}
      {insertableRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Filas a importar{" "}
              <span className="text-muted-foreground font-normal text-sm">
                (primeras {Math.min(PREVIEW_ROWS, insertableRows.length)})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 px-3 text-left font-medium">Ref. catastral</th>
                    <th className="py-2 px-3 text-left font-medium">Pol.</th>
                    <th className="py-2 px-3 text-left font-medium">Parcela</th>
                    <th className="py-2 px-3 text-left font-medium">Superficie</th>
                    <th className="py-2 px-3 text-left font-medium hidden sm:table-cell">Uso</th>
                    <th className="py-2 px-3 text-left font-medium hidden sm:table-cell">Geo</th>
                  </tr>
                </thead>
                <tbody>
                  {insertableRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 font-mono">{row.cadastralRef}</td>
                      <td className="py-2 px-3 font-mono">{row.polygon}</td>
                      <td className="py-2 px-3 font-mono">{row.parcelNumber}</td>
                      <td className="py-2 px-3">
                        {row.surface.toLocaleString("es-ES")} m²
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell text-muted-foreground">
                        {row.landUse ?? "—"}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        {row.geometry ? (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700 text-xs">
                            Sí
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {insertableRows.length > PREVIEW_ROWS && (
              <p className="px-3 py-2 text-xs text-muted-foreground border-t">
                … y {(insertableRows.length - PREVIEW_ROWS).toLocaleString("es-ES")} filas más
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Filas con errores ────────────────────────────────────────────────── */}
      {invalidRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Filas con errores ({invalidRows.length})
            </CardTitle>
            <CardDescription>
              Estas filas serán ignoradas. Corrígelas en el CSV si las necesitas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {invalidRows.slice(0, MAX_ERROR_ROWS).map((row) => (
                <li
                  key={row.rowNumber}
                  className="rounded-md bg-destructive/5 px-3 py-2"
                >
                  <span className="font-medium text-muted-foreground mr-2">
                    Fila {row.rowNumber} · {row.rawCadastralRef}
                  </span>
                  {row.errors.join(" · ")}
                </li>
              ))}
              {invalidRows.length > MAX_ERROR_ROWS && (
                <li className="text-xs text-muted-foreground">
                  … y {invalidRows.length - MAX_ERROR_ROWS} errores más
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Duplicadas in-CSV ────────────────────────────────────────────────── */}
      {inCsvDuplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-700">
              Duplicadas en CSV ({inCsvDuplicates.length})
            </CardTitle>
            <CardDescription>
              Refs que aparecen más de una vez. Se importa solo la primera ocurrencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {inCsvDuplicates.slice(0, 20).join(", ")}
              {inCsvDuplicates.length > 20 && ` … y ${inCsvDuplicates.length - 20} más`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Ya en BD ────────────────────────────────────────────────────────── */}
      {existingInDb.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-700">
              Ya en base de datos ({existingInDb.length})
            </CardTitle>
            <CardDescription>
              Estas referencias catastrales ya existen en tu organización y serán ignoradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {existingInDb.slice(0, 20).join(", ")}
              {existingInDb.length > 20 && ` … y ${existingInDb.length - 20} más`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Botón de confirmación ────────────────────────────────────────────── */}
      <form action={importAction}>
        <input type="hidden" name="context" value={context} />
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={importPending || hasNothing}
            size="lg"
          >
            {importPending
              ? "Importando…"
              : `Importar ${insertableRows.length} parcelas`}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onReset}
            disabled={importPending}
          >
            Cancelar
          </Button>
        </div>
        {hasNothing && (
          <p className="mt-2 text-sm text-muted-foreground">
            No hay parcelas nuevas para importar. Revisa los errores o duplicados arriba.
          </p>
        )}
      </form>
    </div>
  )
}

function StatBlock({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {value.toLocaleString("es-ES")}
      </p>
    </div>
  )
}
