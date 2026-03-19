import { getCurrentUser } from "@/lib/session"
import { logoutAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ProjectSearch } from "@/components/layout/project-search"

/**
 * Header del dashboard. Server Component: usa getCurrentUser() del helper de sesión.
 * No accede a auth() directamente — toda la lógica de sesión pasa por session.ts.
 */
export async function Header() {
  const user = await getCurrentUser()
  const displayName = user?.name ?? user?.email ?? "Usuario"
  const email = user?.email

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
      <ProjectSearch />

      <div className="flex items-center gap-3">
        {/* Avatar e info del usuario */}
        <div className="flex items-center gap-2.5 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="leading-tight">
            <p className="font-medium">{displayName}</p>
            {email && displayName !== email && (
              <p className="text-xs text-muted-foreground">{email}</p>
            )}
          </div>
        </div>

        {/* Logout — usa logoutAction de actions/auth.ts */}
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="icon"
            type="submit"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}
