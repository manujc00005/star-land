import { STATUS_LABELS, type ContractStatus } from "@/lib/validations/contract"
import { cn } from "@/lib/utils"

type Props = { status: ContractStatus }

const variants: Record<ContractStatus, string> = {
  DRAFT:
    "bg-muted text-muted-foreground border border-border",
  ACTIVE:
    "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  EXPIRED:
    "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  SIGNED_ADDENDUM:
    "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
}

export function ContractStatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variants[status]
      )}
    >
      {STATUS_LABELS[status]}
      {status === "SIGNED_ADDENDUM" && <span className="text-[10px]">*</span>}
    </span>
  )
}
