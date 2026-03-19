import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { db } from "@/lib/db"

/**
 * GET /api/projects/search?q=...
 * Búsqueda de proyectos por nombre para el autocomplete del header.
 * Multi-tenant: solo devuelve proyectos de la organización del usuario.
 * Límite: 8 resultados máximo.
 *
 * Nota: el segmento estático "search" tiene precedencia sobre el dinámico "[id]"
 * en Next.js App Router — no hay conflicto con /api/projects/[id]/...
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return new NextResponse("No autenticado", { status: 401 })

  const ctx = createAuthContext(user)
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (!q) return NextResponse.json([])

  const projects = await db.project.findMany({
    where: {
      organizationId: ctx.organizationId,
      name: { contains: q, mode: "insensitive" },
    },
    select: { id: true, name: true, status: true, powerMW: true },
    orderBy: { name: "asc" },
    take: 8,
  })

  return NextResponse.json(projects)
}
