import { cn } from "@/lib/utils"
import { type ProjectStatus, PROJECT_STATUS_LABELS } from "@/lib/validations/project"

const STATUS_STYLES: Record<ProjectStatus, string> = {
  OPPORTUNITY:     "bg-slate-100 text-slate-700",
  IN_DEVELOPMENT:  "bg-blue-100 text-blue-700",
  RTB:             "bg-purple-100 text-purple-700",
  IN_CONSTRUCTION: "bg-amber-100 text-amber-700",
  IN_OPERATION:    "bg-green-100 text-green-700",
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  )
}
