import { requireUser } from "@/lib/session"
import { createAuthContext } from "@/services/base"
import { getOrganizationById } from "@/services/organization.service"
import { getProjects } from "@/services/project.service"
import { DashboardClient, type ProjectSummary } from "@/components/dashboard/dashboard-client"
import type { ProjectMarker } from "@/components/dashboard/dashboard-map"

export default async function DashboardPage() {
  const user = await requireUser()
  const ctx = createAuthContext(user)

  const [org, projects] = await Promise.all([
    getOrganizationById(ctx),
    getProjects(ctx),
  ])

  const firstName = user.name?.split(" ")[0] ?? "Usuario"

  // Compute centroid for each project that has a polygon geometry.
  // Import turf server-side so it never reaches the client bundle.
  const { centroid: turfCentroid } = await import("@turf/turf")

  const allMarkers: ProjectMarker[] = []
  const projectsData: ProjectSummary[] = []

  for (const p of projects) {
    const techs = (p.technologies ?? []) as Array<{ type: string; powerMW?: number }>

    projectsData.push({
      id: p.id,
      name: p.name,
      powerMW: p.powerMW,
      developer: p.developer,
      status: p.status,
      technologies: techs,
      hasGeometry: p.geometry != null,
    })

    if (p.geometry != null) {
      try {
        const center = turfCentroid({
          type: "Feature",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          geometry: p.geometry as any,
          properties: {},
        })
        const [lng, lat] = center.geometry.coordinates
        allMarkers.push({
          id: p.id,
          name: p.name,
          lat,
          lng,
          powerMW: p.powerMW,
          developer: p.developer,
          status: p.status,
          technologies: techs,
        })
      } catch {
        // Geometry inválida — omitir del mapa
      }
    }
  }

  return (
    <DashboardClient
      firstName={firstName}
      orgName={org?.name ?? ""}
      projects={projectsData}
      allMarkers={allMarkers}
    />
  )
}
