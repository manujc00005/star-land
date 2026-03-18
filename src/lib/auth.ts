import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { authConfig } from "@/lib/auth.config"
import { loginSchema } from "@/lib/validations/auth"

/**
 * Configuración completa de Auth.js (Node.js, con Prisma y bcrypt).
 * No usar en middleware — para el edge usar auth.config.ts.
 *
 * Estrategia JWT: no requiere tabla de sesiones en BD.
 * El token lleva id, email, name y organizationId.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        // Valida formato con schema centralizado (mismo que el formulario)
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        )
        if (!isValid) return null

        // Solo los campos necesarios van al token — nunca passwordHash
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
  callbacks: {
    /**
     * jwt: se ejecuta al crear o refrescar el token.
     * Persiste organizationId en JWT para no consultar BD en cada request.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.organizationId = (user as { organizationId: string }).organizationId
      }
      return token
    },

    /**
     * session: expone datos del token al servidor/cliente.
     * Los campos deben coincidir con next-auth.d.ts.
     */
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.organizationId = token.organizationId
      }
      return session
    },
  },
})
