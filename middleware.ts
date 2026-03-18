import NextAuth from "next-auth"
import { authConfig } from "./src/lib/auth.config"

/**
 * Middleware de autenticación.
 * Usa auth.config.ts (sin imports de Node.js) para ser compatible con el Edge Runtime.
 * Protege rutas del dashboard y redirige usuarios autenticados fuera de /login y /register.
 */
export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    // Excluye: archivos estáticos, imágenes Next.js, favicon, y assets con extensión
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
