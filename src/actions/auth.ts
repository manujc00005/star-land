"use server"

import { AuthError } from "next-auth"
import bcrypt from "bcryptjs"
import { signIn, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { loginSchema, registerSchema } from "@/lib/validations/auth"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ActionState = {
  error?: string
  success?: string
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Server Action de login.
 * Compatible con useActionState (React 19): (prevState, formData) => State.
 * signIn con redirectTo lanza NEXT_REDIRECT — debe re-thrownarse.
 */
export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email o contraseña incorrectos" }
        default:
          return { error: "Error al iniciar sesión. Inténtalo de nuevo." }
      }
    }
    throw error // Re-lanza NEXT_REDIRECT para que Next.js procese la redirección
  }
}

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * Server Action de registro.
 *
 * Decisión MVP: auto-login tras registro (mejor UX, menos pasos).
 * Flujo: validar → email único → crear org → crear usuario → signIn.
 *
 * En fases futuras: usar db.$transaction() para atomicidad.
 */
export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    organizationName: formData.get("organizationName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { organizationName, name, email, password } = parsed.data

  try {
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return { error: "Ya existe una cuenta con ese email" }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const organization = await db.organization.create({
      data: { name: organizationName },
    })

    await db.user.create({
      data: { name, email, passwordHash, organizationId: organization.id },
    })
  } catch {
    return { error: "Error al crear la cuenta. Inténtalo de nuevo." }
  }

  // Auto-login tras registro exitoso
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Cuenta creada correctamente. Inicia sesión para continuar.",
      }
    }
    throw error
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Server Action de logout.
 * Limpia la sesión JWT y redirige a /login.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
