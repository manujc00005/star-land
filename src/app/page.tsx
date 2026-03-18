import { redirect } from "next/navigation"

// La raíz del sitio redirige siempre al dashboard.
// El middleware se encargará de redirigir a /login si no hay sesión.
export default function RootPage() {
  redirect("/dashboard")
}
