import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

/**
 * Header del dashboard. Server Component: accede a la sesión directamente.
 * Muestra info del usuario y botón de logout.
 */
export async function Header() {
  const session = await auth()
  const displayName = session?.user?.name ?? session?.user?.email ?? "Usuario"
  const email = session?.user?.email

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6 shrink-0">
      <div /> {/* Espacio para futuro breadcrumb */}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-right leading-tight">
            <p className="font-medium">{displayName}</p>
            {email && displayName !== email && (
              <p className="text-xs text-muted-foreground">{email}</p>
            )}
          </div>
        </div>

        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
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
