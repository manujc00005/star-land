"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { detectParcelsAction, type DetectState } from "@/actions/project-parcel"
import { ScanSearch } from "lucide-react"

type Props = {
  projectId: string
}

export function DetectParcelsButton({ projectId }: Props) {
  const [state, formAction, pending] = useActionState<DetectState, FormData>(
    detectParcelsAction.bind(null, projectId),
    null
  )

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          <ScanSearch className="h-4 w-4 mr-1.5" />
          {pending ? "Detectando…" : "Detectar parcelas automáticamente"}
        </Button>
      </form>

      {state?.phase === "done" && (
        <div className="rounded-md border bg-muted/40 px-3 py-2.5 text-xs">
          <p className="font-medium text-sm mb-1.5">Cruce espacial completado</p>
          <div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-0.5 text-muted-foreground">
            <span>Parcelas analizadas</span>
            <span className="tabular-nums text-right font-medium text-foreground">
              {state.result.analyzedParcels}
            </span>
            <span>Intersectan con el proyecto</span>
            <span className="tabular-nums text-right font-medium text-foreground">
              {state.result.intersected}
            </span>
            <span>Nuevas relaciones creadas</span>
            <span className="tabular-nums text-right font-medium text-foreground">
              {state.result.created}
            </span>
            {state.result.alreadyExisted > 0 && (
              <>
                <span>Ya existían</span>
                <span className="tabular-nums text-right">
                  {state.result.alreadyExisted}
                </span>
              </>
            )}
            {state.result.skippedNoGeometry > 0 && (
              <>
                <span>Sin geometría (ignoradas)</span>
                <span className="tabular-nums text-right">
                  {state.result.skippedNoGeometry}
                </span>
              </>
            )}
            {state.result.errors > 0 && (
              <>
                <span className="text-yellow-600 dark:text-yellow-400">
                  Geometrías inválidas
                </span>
                <span className="tabular-nums text-right text-yellow-600 dark:text-yellow-400">
                  {state.result.errors}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {state?.phase === "error" && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  )
}
