"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteOwnerAction } from "@/actions/owner"

export function DeleteOwnerButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm("¿Eliminar este propietario? Esta acción no se puede deshacer.")) return
    startTransition(async () => {
      await deleteOwnerAction(id)
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
