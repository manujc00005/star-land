import { TYPE_LABELS, type ContractType } from "@/lib/validations/contract"
import { cn } from "@/lib/utils"

type Props = { type: ContractType }

const variants: Record<ContractType, string> = {
  RENTAL:
    "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  PURCHASE:
    "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
}

export function ContractTypeBadge({ type }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[type]
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  )
}
