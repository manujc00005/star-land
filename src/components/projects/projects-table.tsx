"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react"
import { type ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/validations/project"

type ProjectRow = {
  id: string
  name: string
  powerMW: number | null
  status: ProjectStatus
  createdAt: Date
}

type SortKey = keyof Omit<ProjectRow, "id">
type SortDir = "asc" | "desc"

const COLUMNS: { key: SortKey; label: string; hiddenMobile?: boolean }[] = [
  { key: "name", label: "Nombre" },
  { key: "powerMW", label: "Potencia" },
  { key: "status", label: "Estado" },
  { key: "createdAt", label: "Creado", hiddenMobile: true },
]

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return projects
    return projects.filter((p) =>
      [
        p.name,
        `${p.powerMW} mw`,
        p.status,
        PROJECT_STATUS_LABELS[p.status],
        p.createdAt.toLocaleDateString("es-ES"),
      ].some((v) => v.toLowerCase().includes(q))
    )
  }, [projects, query])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name" || sortKey === "status") {
        cmp = a[sortKey].localeCompare(b[sortKey], "es")
      } else if (sortKey === "powerMW") {
        cmp = (a.powerMW ?? -1) - (b.powerMW ?? -1)
      } else if (sortKey === "createdAt") {
        cmp = a.createdAt.getTime() - b.createdAt.getTime()
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proyectos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {query
                ? `Sin resultados para "${query}"`
                : "No hay proyectos registrados."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={[
                        "py-3 px-4 text-left font-medium cursor-pointer select-none hover:text-foreground",
                        col.hiddenMobile ? "hidden md:table-cell" : "",
                      ].join(" ")}
                    >
                      {col.label}
                      <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-medium">{project.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {project.powerMW != null ? `${project.powerMW} MW` : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {project.createdAt.toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey
  sortKey: SortKey
  sortDir: SortDir
}) {
  if (col !== sortKey)
    return (
      <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground/50 inline" />
    )
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3 inline" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3 inline" />
  )
}
