import type { NextAuthConfig } from "next-auth"

/**
 * Configuración edge-compatible de Auth.js.
 * NO importa Node.js APIs (sin Prisma, sin bcrypt).
 * Usado por middleware.ts para validar acceso a rutas protegidas.
 */

const PROTECTED_PATHS = [
  "/dashboard",
  "/projects",
  "/parcels",
  "/owners",
  "/contracts",
  "/settings",
]

const AUTH_PATHS = ["/login", "/register"]

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      const isProtected = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path)
      )
      const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path))

      // Ruta protegida sin sesión → redirige a login
      if (isProtected && !isLoggedIn) return false

      // Ya autenticado intentando acceder a login/register → redirige a dashboard
      if (isAuthPath && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      return true
    },
  },
  providers: [], // Los providers reales están en auth.ts (necesitan Node.js)
}
