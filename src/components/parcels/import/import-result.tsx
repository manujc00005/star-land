import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import type { ImportResult } from "@/lib/csv/parcel-csv-parser"

export function ImportResultView({ result }: { result: ImportResult }) {
  const {
    totalCsvRows,
    inserted,
    skippedDbDuplicates,
    skippedInvalidRows,
    skippedCsvDuplicates,
  } = result

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-semibold">Importación completada</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Filas en el CSV" value={totalCsvRows} />
          <Row
            label="Parcelas insertadas"
            value={inserted}
            highlight="green"
          />
          {skippedInvalidRows > 0 && (
            <Row
              label="Filas inválidas ignoradas"
              value={skippedInvalidRows}
              highlight="red"
            />
          )}
          {skippedCsvDuplicates > 0 && (
            <Row
              label="Duplicadas en CSV (ignoradas)"
              value={skippedCsvDuplicates}
              highlight="amber"
            />
          )}
          {skippedDbDuplicates > 0 && (
            <Row
              label="Ya existían en base de datos"
              value={skippedDbDuplicates}
              highlight="amber"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/parcels">Ver parcelas</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/parcels/import">Nueva importación</Link>
        </Button>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: "green" | "red" | "amber"
}) {
  const colorMap = {
    green: "text-green-700 font-bold",
    red: "text-destructive font-bold",
    amber: "text-amber-700 font-bold",
  }
  return (
    <div className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? colorMap[highlight] : "font-medium"}>
        {value.toLocaleString("es-ES")}
      </span>
    </div>
  )
}
