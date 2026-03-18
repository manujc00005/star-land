"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  Users,
  FileText,
  Settings,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/parcels", label: "Parcelas", icon: MapPin },
  { href: "/owners", label: "Propietarios", icon: Users },
  { href: "/contracts", label: "Contratos", icon: FileText },
  { href: "/settings", label: "Configuración", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card shrink-0">
      {/* Marca */}
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">StarLand</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Pie */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">v0.1.0 · MVP</p>
      </div>
    </aside>
  )
}
