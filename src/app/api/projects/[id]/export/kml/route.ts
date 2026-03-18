import { NextResponse, type NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { db } from "@/lib/db"
import { generateProjectKml } from "@/lib/kml/generator"

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/projects/[id]/export/kml
 *
 * Genera y devuelve el archivo KML del proyecto como descarga directa.
 *
 * Seguridad:
 *   - Requiere sesión activa (401 si no autenticado)
 *   - Filtra por organizationId del JWT (404 si el proyecto no pertenece a la org)
 *   - Prisma solo en servidor — sin datos del cliente
 *
 * Datos incluidos:
 *   - Recinto del proyecto (geometry)
 *   - Parcelas vinculadas vía ProjectParcel
 *   - Contratos + propietarios de cada parcela
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  // Autenticación: usar getCurrentUser (no requireUser) para devolver 401
  // en lugar de redirigir a /login desde un endpoint API
  const user = await getCurrentUser()
  if (!user) {
    return new NextResponse("No autenticado", { status: 401 })
  }

  const ctx = createAuthContext(user)

  // 1. Obtener proyecto validando pertenencia a la organización
  const project = await db.project.findFirst({
    where: { id, organizationId: ctx.organizationId },
    select: {
      id: true,
      name: true,
      powerMW: true,
      status: true,
      geometry: true,
    },
  })

  if (!project) {
    return new NextResponse("Proyecto no encontrado", { status: 404 })
  }

  // 2. Parcelas vinculadas al proyecto
  const projectParcels = await db.projectParcel.findMany({
    where: { projectId: id, organizationId: ctx.organizationId },
    include: {
      parcel: {
        select: {
          id: true,
          cadastralRef: true,
          polygon: true,
          parcelNumber: true,
          surface: true,
          landUse: true,
          geometry: true,
        },
      },
    },
  })

  const parcelIds = projectParcels.map((pp) => pp.parcelId)

  // 3. Contratos de esas parcelas (una sola query, sin N+1)
  const contracts =
    parcelIds.length > 0
      ? await db.contract.findMany({
          where: {
            organizationId: ctx.organizationId,
            parcelId: { in: parcelIds },
          },
          select: {
            parcelId: true,
            type: true,
            status: true,
            price: true,
            signedAt: true,
            owner: { select: { name: true, nif: true } },
          },
        })
      : []

  // 4. Agrupar contratos por parcelId
  const contractsByParcel = new Map<string, typeof contracts>()
  for (const contract of contracts) {
    const existing = contractsByParcel.get(contract.parcelId) ?? []
    contractsByParcel.set(contract.parcelId, [...existing, contract])
  }

  // 5. Generar KML
  const kmlData = {
    project,
    parcels: projectParcels.map((pp) => ({
      ...pp.parcel,
      contracts: contractsByParcel.get(pp.parcel.id) ?? [],
    })),
  }

  let kml: string
  try {
    kml = generateProjectKml(kmlData)
  } catch {
    return new NextResponse("Error al generar el KML", { status: 500 })
  }

  // 6. Nombre de archivo seguro (sin acentos ni caracteres especiales)
  const safeFilename = project.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "proyecto"

  return new NextResponse(kml, {
    headers: {
      "Content-Type": "application/vnd.google-earth.kml+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="proyecto-${safeFilename}.kml"`,
      "Cache-Control": "no-store",
    },
  })
}
