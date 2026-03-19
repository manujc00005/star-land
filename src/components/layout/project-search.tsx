"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import type { ProjectStatus } from "@/lib/validations/project"

type SearchResult = {
  id: string
  name: string
  status: ProjectStatus
  powerMW: number | null
}

export function ProjectSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/projects/search?q=${encodeURIComponent(q)}`
      )
      if (res.ok) {
        const data: SearchResult[] = await res.json()
        setResults(data)
        setIsOpen(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function handleSelect(id: string) {
    setQuery("")
    setResults([])
    setIsOpen(false)
    router.push(`/projects/${id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false)
      setQuery("")
    }
  }

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Buscar proyecto…"
          className="flex h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {isLoading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full z-50 rounded-md border bg-popover shadow-md overflow-hidden">
          {results.length > 0 ? (
            results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted text-left gap-2"
              >
                <span className="truncate font-medium">{r.name}</span>
                <ProjectStatusBadge status={r.status} />
              </button>
            ))
          ) : (
            !isLoading && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Sin resultados
              </p>
            )
          )}
        </div>
      )}
    </div>
  )
}
