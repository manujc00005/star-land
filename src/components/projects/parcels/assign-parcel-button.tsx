"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { assignParcelAction } from "@/actions/project-parcel"
import { Plus } from "lucide-react"

type Props = {
  projectId: string
  parcelId: string
}

export function AssignParcelButton({ projectId, parcelId }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => assignParcelAction(projectId, parcelId))
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className="h-7 gap-1 text-xs"
    >
      <Plus className="h-3 w-3" />
      {pending ? "Asignando…" : "Asignar"}
    </Button>
  )
}
