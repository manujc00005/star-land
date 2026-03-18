"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteContractAction } from "@/actions/contract"

type Props = { id: string }

export function DeleteContractButton({ id }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm("¿Eliminar este contrato? Esta acción no se puede deshacer.")) return
    startTransition(() => deleteContractAction(id))
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </Button>
  )
}
