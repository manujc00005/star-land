"use server"

import { AuthError } from "next-auth"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { signIn } from "@/lib/auth"
import { db } from "@/lib/db"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ActionState = {
  error?: string
  success?: string
}

// ─── Schemas de validación ────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

const registerSchema = z.object({
  organizationName: z
    .string()
    .min(2, "El nombre de la organización debe tener al menos 2 caracteres"),
  name: z.string().min(2, "Tu nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
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
    // Re-lanza para que Next.js procese el redirect
    throw error
  }
}

// ─── Registro ────────────────────────────────────────────────────────────────

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
    return { error: parsed.error.errors[0].message }
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

  // Inicia sesión automáticamente tras el registro
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
        error: "Cuenta creada. Ve a iniciar sesión.",
      }
    }
    throw error
  }
}
