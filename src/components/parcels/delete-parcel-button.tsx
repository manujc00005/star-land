"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteParcelAction } from "@/actions/parcel"

export function DeleteParcelButton({
  id,
  redirectAfter = false,
}: {
  id: string
  /** Si true, redirige a /parcels tras borrar (útil desde la página de detalle) */
  redirectAfter?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (
      !window.confirm(
        "¿Eliminar esta parcela? Esta acción no se puede deshacer."
      )
    )
      return

    startTransition(async () => {
      await deleteParcelAction(id)
      if (redirectAfter) router.push("/parcels")
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? "Eliminando…" : "Eliminar"}
    </Button>
  )
}
