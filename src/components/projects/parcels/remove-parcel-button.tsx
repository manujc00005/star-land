"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { removeParcelAction } from "@/actions/project-parcel"
import { X } from "lucide-react"

type Props = {
  projectId: string
  parcelId: string
}

export function RemoveParcelButton({ projectId, parcelId }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!window.confirm("¿Quitar esta parcela del proyecto?")) return
    startTransition(() => removeParcelAction(projectId, parcelId))
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleClick}
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      aria-label="Quitar parcela"
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  )
}
