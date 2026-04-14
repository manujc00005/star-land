"use client"

import { useState, useCallback, useActionState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Upload, ArrowRight, ArrowLeft, Check, AlertTriangle,
  FileSpreadsheet, Loader2, CheckCircle2, X,
} from "lucide-react"
import { parseFile, extractProjectMetadata } from "@/lib/import/file-parser"
import type { ParsedSheet } from "@/lib/import/file-parser"
import {
  autoMapColumns, IMPORT_FIELDS,
  mapNegotiationStatus,
  type ColumnMapping, type ImportField,
} from "@/lib/import/column-matcher"
import {
  importProjectAction,
  type ProjectImportState, type ImportRow,
} from "@/actions/project-import"

// ── Tipos internos ───────────────────────────────────────────────────────────

type Step = "upload" | "mapping" | "preview" | "importing" | "done"

type ProjectForm = {
  name: string
  cluster: string
  developer: string
  spv: string
  status: string
  technologyType: string
  technologyMW: string
}

// ── Componente principal ─────────────────────────────────────────────────────

export function ImportWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [fileName, setFileName] = useState("")
  const [sheets, setSheets] = useState<ParsedSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState(0)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: "", cluster: "", developer: "", spv: "",
    status: "OPPORTUNITY", technologyType: "", technologyMW: "",
  })

  // ── Step 1: Upload ───────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    const valid = ["xlsx", "xls", "csv", "tsv"]
    if (!ext || !valid.includes(ext)) {
      alert("Formato no soportado. Usa .xlsx, .csv o .tsv")
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const parsed = await parseFile(file)
      if (parsed.length === 0) {
        alert("No se encontró una tabla de datos válida en el archivo.")
        return
      }

      const metadata = extractProjectMetadata(file, buffer)
      setSheets(parsed)
      setSelectedSheet(0)
      setFileName(file.name)

      // Auto-map columns
      const maps = autoMapColumns(parsed[0].headers)
      setMappings(maps)

      // Fill project form from metadata
      setProjectForm((prev) => ({
        ...prev,
        name: metadata.name || file.name.replace(/\.\w+$/, ""),
        cluster: metadata.cluster || "",
      }))

      setStep("mapping")
    } catch {
      alert("Error al leer el archivo. Verifica que no esté corrupto.")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Step 2: Mapping ──────────────────────────────────────────────────────

  const updateMapping = (index: number, field: ImportField) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, field, confidence: "exact" as const } : m))
    )
  }

  const activeSheet = sheets[selectedSheet]
  const requiredFields = Object.entries(IMPORT_FIELDS)
    .filter(([, v]) => v.required)
    .map(([k]) => k as ImportField)

  const mappedFields = new Set(mappings.filter((m) => m.field !== "skip").map((m) => m.field))
  const missingRequired = requiredFields.filter((f) => !mappedFields.has(f))

  // ── Step 3: Build preview rows ────────────────────────────────────────────

  const previewRows: ImportRow[] = activeSheet
    ? activeSheet.rows.map((row) => {
        const get = (field: ImportField): string => {
          const mapping = mappings.find((m) => m.field === field)
          if (!mapping || mapping.field === "skip") return ""
          return row[mapping.index] ?? ""
        }

        const rawSuperficie = get("superficie")
        const superficie = parseFloat(rawSuperficie.replace(/[^\d.,]/g, "").replace(",", ".")) || 0

        return {
          refCatastral: get("refCatastral"),
          municipio: get("municipio"),
          poligono: get("poligono"),
          parcela: get("parcela"),
          superficie,
          propietario: get("propietario"),
          nifPropietario: get("nifPropietario"),
          estadoNegociacion: mapNegotiationStatus(get("estadoNegociacion")),
          email: get("email"),
          telefono: get("telefono"),
          notas: get("notas"),
        }
      })
    : []

  const validRows = previewRows.filter((r) => r.refCatastral.trim())
  const invalidCount = previewRows.length - validRows.length

  // ── Step 4: Import action ─────────────────────────────────────────────────

  const [importState, submitImport, isPending] = useActionState<ProjectImportState, FormData>(
    importProjectAction, null,
  )

  const handleImport = () => {
    setStep("importing")
    const fd = new FormData()
    fd.set("payload", JSON.stringify({ project: projectForm, rows: validRows }))
    submitImport(fd)
  }

  // Watch for import completion
  if (importState?.phase === "done" && step === "importing") {
    setStep("done")
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { key: "upload", label: "1. Subir archivo" },
          { key: "mapping", label: "2. Mapear columnas" },
          { key: "preview", label: "3. Verificar datos" },
        ].map(({ key, label }, i) => {
          const isActive = step === key
          const isDone =
            (key === "upload" && step !== "upload") ||
            (key === "mapping" && (step === "preview" || step === "importing" || step === "done")) ||
            (key === "preview" && (step === "importing" || step === "done"))
          return (
            <div key={key} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-6 bg-border" />}
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                isActive ? "bg-primary text-primary-foreground" :
                isDone ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}>
                {isDone ? <Check className="h-3 w-3" /> : null}
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardContent className="py-12">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 hover:border-primary/50 transition-colors"
            >
              <Upload className="h-12 w-12 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-lg font-medium">Arrastra tu archivo aquí</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Soporta .xlsx, .csv, .tsv
                </p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.tsv"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <Button variant="outline" asChild>
                  <span>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Seleccionar archivo
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === "mapping" && activeSheet && (
        <div className="space-y-6">
          {/* Project info */}
          <Card>
            <CardContent className="py-5">
              <h3 className="font-medium mb-4">Datos del proyecto</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Nombre del proyecto *</label>
                  <input
                    value={projectForm.name}
                    onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Nombre del proyecto"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Cluster</label>
                  <input
                    value={projectForm.cluster}
                    onChange={(e) => setProjectForm((p) => ({ ...p, cluster: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Sur peninsular"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Developer</label>
                  <input
                    value={projectForm.developer}
                    onChange={(e) => setProjectForm((p) => ({ ...p, developer: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Iberdrola"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">SPV</label>
                  <input
                    value={projectForm.spv}
                    onChange={(e) => setProjectForm((p) => ({ ...p, spv: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Solar Sur SL"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Estado</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm((p) => ({ ...p, status: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="OPPORTUNITY">Oportunidad</option>
                    <option value="IN_DEVELOPMENT">En Desarrollo</option>
                    <option value="RTB">Ready to Build</option>
                    <option value="IN_CONSTRUCTION">En Construcción</option>
                    <option value="IN_OPERATION">En Operación</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tecnología</label>
                  <input
                    value={projectForm.technologyType}
                    onChange={(e) => setProjectForm((p) => ({ ...p, technologyType: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Fotovoltaica"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Potencia (MW)</label>
                  <input
                    type="number"
                    value={projectForm.technologyMW}
                    onChange={(e) => setProjectForm((p) => ({ ...p, technologyMW: e.target.value }))}
                    className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: 100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sheet selector (if multiple) */}
          {sheets.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hoja:</span>
              {sheets.map((s, i) => (
                <Button
                  key={i}
                  variant={i === selectedSheet ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSheet(i)
                    setMappings(autoMapColumns(s.headers))
                  }}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          )}

          {/* Column mapping */}
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Mapeo de columnas</h3>
                <span className="text-xs text-muted-foreground">
                  Archivo: {fileName} · {activeSheet.rows.length} filas · {activeSheet.headers.length} columnas
                </span>
              </div>

              {missingRequired.length > 0 && (
                <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Columnas requeridas sin asignar: {missingRequired.map((f) => IMPORT_FIELDS[f].label).join(", ")}
                </div>
              )}

              <div className="space-y-2">
                {mappings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md border p-2.5">
                    {/* Original header */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-mono truncate block">{m.originalHeader}</span>
                      <span className="text-xs text-muted-foreground">
                        Ej: {activeSheet.rows[0]?.[m.index] || "—"}
                      </span>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                    {/* Field selector */}
                    <div className="flex items-center gap-2">
                      <select
                        value={m.field}
                        onChange={(e) => updateMapping(i, e.target.value as ImportField)}
                        className={`h-8 w-48 rounded-md border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                          m.confidence === "exact" ? "border-green-300 bg-green-50" :
                          m.confidence === "fuzzy" ? "border-amber-300 bg-amber-50" :
                          m.field === "skip" ? "border-input bg-muted text-muted-foreground" :
                          "border-input bg-background"
                        }`}
                      >
                        {Object.entries(IMPORT_FIELDS).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      {m.confidence === "exact" && <Check className="h-4 w-4 text-green-600" />}
                      {m.confidence === "fuzzy" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("upload")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button
              onClick={() => setStep("preview")}
              disabled={missingRequired.length > 0 || !projectForm.name.trim()}
            >
              Verificar datos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-2xl font-bold">{validRows.length}</p>
                <p className="text-xs text-muted-foreground">Parcelas válidas</p>
              </CardContent>
            </Card>
            {invalidCount > 0 && (
              <Card className="border-amber-200">
                <CardContent className="py-3 px-4">
                  <p className="text-2xl font-bold text-amber-600">{invalidCount}</p>
                  <p className="text-xs text-muted-foreground">Sin ref. catastral (se omiten)</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="py-3 px-4">
                <p className="text-2xl font-bold">
                  {new Set(validRows.map((r) => r.propietario).filter(Boolean)).size}
                </p>
                <p className="text-xs text-muted-foreground">Propietarios detectados</p>
              </CardContent>
            </Card>
          </div>

          {/* Project summary */}
          <Card>
            <CardContent className="py-4">
              <h3 className="font-medium mb-2">Proyecto: {projectForm.name}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {projectForm.cluster && <span>Cluster: {projectForm.cluster}</span>}
                {projectForm.developer && <span>Developer: {projectForm.developer}</span>}
                {projectForm.technologyType && (
                  <span>{projectForm.technologyType} {projectForm.technologyMW ? `· ${projectForm.technologyMW} MW` : ""}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data table preview */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-2 px-3 text-left font-medium">#</th>
                      <th className="py-2 px-3 text-left font-medium">Ref. Catastral</th>
                      <th className="py-2 px-3 text-left font-medium">Municipio</th>
                      <th className="py-2 px-3 text-left font-medium">Superficie</th>
                      <th className="py-2 px-3 text-left font-medium">Propietario</th>
                      <th className="py-2 px-3 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 px-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-1.5 px-3 font-mono">{row.refCatastral}</td>
                        <td className="py-1.5 px-3">{row.municipio || "—"}</td>
                        <td className="py-1.5 px-3 tabular-nums">
                          {row.superficie ? row.superficie.toLocaleString("es-ES") + " m²" : "—"}
                        </td>
                        <td className="py-1.5 px-3">{row.propietario || "—"}</td>
                        <td className="py-1.5 px-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                            {row.estadoNegociacion}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validRows.length > 50 && (
                  <p className="py-2 text-center text-xs text-muted-foreground">
                    Mostrando 50 de {validRows.length} filas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("mapping")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ajustar mapeo
            </Button>
            <Button onClick={handleImport} disabled={validRows.length === 0}>
              <Check className="h-4 w-4 mr-2" />
              Importar {validRows.length} parcelas
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Importing / Done */}
      {(step === "importing" || step === "done") && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-4">
            {isPending || (step === "importing" && !importState) ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-lg font-medium">Importando datos...</p>
                <p className="text-sm text-muted-foreground">Creando proyecto, parcelas y propietarios</p>
              </>
            ) : importState?.phase === "error" ? (
              <>
                <X className="h-10 w-10 text-red-500" />
                <p className="text-lg font-medium text-red-700">Error en la importación</p>
                <p className="text-sm text-muted-foreground">{importState.error}</p>
                <Button variant="outline" onClick={() => setStep("preview")}>
                  Volver al preview
                </Button>
              </>
            ) : importState?.phase === "done" ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <p className="text-lg font-medium">Importación completada</p>
                <div className="grid gap-2 text-sm text-center">
                  <p>Proyecto: <strong>{importState.summary.projectName}</strong></p>
                  <div className="flex gap-6 text-muted-foreground">
                    <span>{importState.summary.parcelsCreated} parcelas creadas</span>
                    {importState.summary.parcelsExisting > 0 && (
                      <span>{importState.summary.parcelsExisting} ya existían</span>
                    )}
                    <span>{importState.summary.ownersCreated} propietarios creados</span>
                    <span>{importState.summary.relationsCreated} vinculaciones</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button onClick={() => router.push(`/projects/${importState.summary.projectId}`)}>
                    Ver proyecto
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep("upload")
                    setSheets([])
                    setMappings([])
                    setProjectForm({ name: "", cluster: "", developer: "", spv: "", status: "OPPORTUNITY", technologyType: "", technologyMW: "" })
                  }}>
                    Importar otro
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
