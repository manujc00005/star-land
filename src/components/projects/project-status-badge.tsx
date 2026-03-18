import { cn } from "@/lib/utils"
import {
  type ProjectStatus,
  STATUS_LABELS,
} from "@/lib/validations/project"

const STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: "bg-blue-100 text-blue-700",
  CONSTRUCTION: "bg-amber-100 text-amber-700",
  OPERATIVE: "bg-green-100 text-green-700",
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
