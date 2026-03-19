"use client"

import { useTransition } from "react"
import { updateAffectationAction } from "@/actions/project-parcel"
import { AFFECTATION_OPTIONS } from "@/lib/validations/affectation"

type Props = {
  projectParcelId: string
  projectId: string
  value: string | null
}

export function AffectationSelect({ projectParcelId, projectId, value }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value || null
    startTransition(async () => {
      await updateAffectationAction(projectParcelId, projectId, next)
    })
  }

  return (
    <select
      defaultValue={value ?? ""}
      onChange={handleChange}
      disabled={isPending}
      className="h-7 rounded border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 min-w-[7rem]"
    >
      <option value="">—</option>
      {AFFECTATION_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}
