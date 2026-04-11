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

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string
  label: string
  icon: React.ElementType
  isActive: boolean
}) {
  return (
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
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const active = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card shrink-0">
      {/* Marca */}
      <div className="flex h-16 items-center gap-2.5 border-b px-6">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">StarLand</span>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col flex-1 overflow-y-auto px-3 py-4 gap-0.5">
        {/* Dashboard */}
        <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} isActive={active("/dashboard")} />

        <hr className="border-border my-2" />

        {/* Proyectos — Fase 2: "Subestaciones" se añadirá aquí al mismo nivel */}
        <NavLink href="/projects" label="Proyectos" icon={FolderKanban} isActive={active("/projects")} />

        <hr className="border-border my-2" />

        {/* Base de datos */}
        <p className="px-3 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Base de datos
        </p>
        <NavLink href="/parcels" label="Parcelas" icon={MapPin} isActive={active("/parcels")} />
        <NavLink href="/owners" label="Propietarios" icon={Users} isActive={active("/owners")} />
        <NavLink href="/contracts" label="Contratos" icon={FileText} isActive={active("/contracts")} />

        {/* Empuja configuración al fondo */}
        <div className="flex-1" />

        <hr className="border-border my-2" />
        <NavLink href="/settings" label="Configuración" icon={Settings} isActive={active("/settings")} />
      </nav>

      {/* Pie */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">v0.1.0 · MVP</p>
      </div>
    </aside>
  )
}
