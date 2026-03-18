import { handlers } from "@/lib/auth"

// Delega todos los endpoints de Auth.js (/api/auth/signin, /callback, etc.)
export const { GET, POST } = handlers
