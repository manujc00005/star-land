"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Zap } from "lucide-react"
import { registerAction, type ActionState } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: ActionState = {}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  )

  return (
    <div className="w-full max-w-sm">
      {/* Marca */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary" />
          <span className="text-2xl font-bold tracking-tight">StarLand</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Gestión de suelo · Energías renovables
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Registra tu organización y accede a la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre de la organización</Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="Mi Empresa Renovables S.L."
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input
                id="name"
                name="name"
                placeholder="Juan García"
                required
                autoComplete="name"
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@empresa.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
