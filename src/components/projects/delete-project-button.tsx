"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteProjectAction } from "@/actions/project"

export function DeleteProjectButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (
      !window.confirm(
        "¿Eliminar este proyecto? Esta acción no se puede deshacer."
      )
    )
      return

    startTransition(async () => {
      await deleteProjectAction(id)
      router.push("/projects")
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
