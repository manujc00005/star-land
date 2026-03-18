# StarLand

SaaS para la gestión de proyectos de energía renovable — parcelas catastrales, propietarios, contratos y análisis espacial.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| Base de datos | PostgreSQL (Docker local / Neon en prod) |
| ORM | Prisma v6 |
| Auth | NextAuth v5 (credentials) |
| Mapas | Leaflet (OpenStreetMap, sin API key) |
| GIS | Turf.js (intersecciones espaciales) |
| Deploy | Vercel |

---

## Desarrollo local

### Requisitos

- Node.js 20+
- Docker Desktop en ejecución

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

`.env` mínimo para local:

```env
DATABASE_URL="postgresql://starland:starland_pass@127.0.0.1:5433/starland?sslmode=disable"
DIRECT_URL="postgresql://starland:starland_pass@127.0.0.1:5433/starland?sslmode=disable"
AUTH_SECRET="cualquier-string-de-32-caracteres-minimo"
NEXTAUTH_URL="http://localhost:3000"
```

> `AUTH_SECRET` se puede generar con `npx auth secret`

### 3. Levantar la base de datos

```bash
npm run db:up
```

Arranca un contenedor PostgreSQL 16 en el puerto **5433**.

### 4. Aplicar el schema

```bash
npx prisma migrate deploy && npx prisma generate
```

### 5. Arrancar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) → regístrate para crear tu organización.

---

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run db:up` | Levanta el contenedor Docker de PostgreSQL |
| `npm run db:down` | Para el contenedor |
| `npm run db:reset` | Borra el volumen y recrea el contenedor ⚠️ borra datos |
| `npm run db:studio` | Abre Prisma Studio en el navegador (puerto 5555) |
| `npm run db:migrate` | Crea una nueva migration (`prisma migrate dev`) |
| `npm run db:push` | Sincroniza el schema sin crear migration (`prisma db push`) |
| `npm run db:generate` | Regenera el cliente Prisma |

---

## Gestión del schema (migraciones)

### Añadir un campo o tabla

```bash
# 1. Edita prisma/schema.prisma

# 2. Crea la migration y aplícala en local
npx prisma migrate dev --name descripcion_del_cambio

# Genera: prisma/migrations/YYYYMMDDHHMMSS_descripcion/migration.sql
# Y la aplica en Docker local automáticamente

# 3. Commit
git add prisma/
git commit -m "feat: add notes field to parcel"

# 4. Push → Vercel aplica la migration en Neon automáticamente en el build
```

### Ver el estado de las migraciones

```bash
npx prisma migrate status
```

---

## Producción (Vercel + Neon)

### Variables de entorno en Vercel

En **Settings → Environment Variables** añade:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL del **pooler** de Neon (PgBouncer, para queries) |
| `DIRECT_URL` | URL **directa** de Neon (sin pooler, solo para migraciones) |
| `AUTH_SECRET` | String aleatorio de mínimo 32 caracteres |
| `NEXTAUTH_URL` | `https://tu-app.vercel.app` |

Ejemplo de URLs Neon:
```
DATABASE_URL=postgresql://USER:PASS@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://USER:PASS@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

> La diferencia está en el hostname: `DATABASE_URL` tiene `-pooler` (PgBouncer optimizado para serverless). `DIRECT_URL` es la conexión directa que Prisma necesita para ejecutar migraciones.

### Build command (ya configurado en package.json)

```
prisma generate && prisma migrate deploy && next build
```

- **`prisma generate`** — regenera el cliente Prisma con el schema actual
- **`prisma migrate deploy`** — aplica todas las migrations pendientes en Neon
- **`next build`** — compila la aplicación

En el **primer deploy** Neon está vacío y `migrate deploy` crea todas las tablas desde `prisma/migrations/`. En deploys posteriores solo aplica las migrations nuevas.

### Primer deploy

```bash
# Asegúrate de que las migrations están commiteadas
git add prisma/
git push origin main
# Vercel detecta el push → build → crea las tablas en Neon
```

---

## Arquitectura

```
src/
├── app/
│   ├── (auth)/                          # Registro y login
│   ├── (dashboard)/                     # Páginas protegidas
│   │   ├── projects/[id]/               # Detalle proyecto + mapa + KML
│   │   ├── parcels/                     # Parcelas + importación CSV
│   │   ├── owners/                      # Propietarios
│   │   └── contracts/                   # Contratos
│   └── api/projects/[id]/export/kml/    # Endpoint KML para Google Earth
├── actions/          # Server Actions (mutaciones)
├── services/         # Lógica de negocio con AuthContext
├── lib/
│   ├── gis/          # Intersecciones espaciales (Turf.js)
│   ├── kml/          # Generación de KML
│   └── validations/  # Schemas Zod
└── components/
    ├── map/          # GeoMap con Leaflet (lazy-load client-side)
    ├── projects/
    ├── parcels/
    ├── contracts/
    └── ui/           # Button, Card, Badge…

prisma/
├── schema.prisma     # Modelos y datasource
└── migrations/       # Historial SQL de migrations
```

### Multi-tenancy

Cada entidad tiene `organizationId`. El patrón `AuthContext` garantiza que el `organizationId` **nunca viene del cliente** — siempre se extrae del JWT en el servidor:

```typescript
const user = await requireUser()       // lee JWT
const ctx  = createAuthContext(user)   // { organizationId }
const data = await getProjects(ctx)    // WHERE organizationId = ctx.organizationId
```

---

## Demo rápida

Flujo completo para probar todas las funcionalidades:

```
1. /register              → crear cuenta (crea organización automáticamente)
2. /parcels/import        → subir demo-parcelas.csv (descarga el enlace de la página)
                            6 parcelas con geometría GeoJSON real en Córdoba
3. /owners/new            → crear un propietario de prueba
4. /projects/new          → crear proyecto (nombre + potencia MW)
5. /projects/[id]         → pegar este GeoJSON en "Recinto del proyecto" y guardar:
                            {"type":"Polygon","coordinates":[[
                              [-4.810,37.494],[-4.794,37.494],
                              [-4.794,37.510],[-4.810,37.510],[-4.810,37.494]
                            ]]}
6. /projects/[id]         → "Detectar parcelas automáticamente"
                            Turf.js cruza geometrías → vincula las 4 parcelas que intersectan
7. /projects/[id]         → card "Mapa" → recinto azul + parcelas ámbar sobre OpenStreetMap
8. /contracts/new         → crear contrato vinculando parcela + propietario
9. /projects/[id]         → mapa actualizado → parcela con contrato aparece en verde
10. /projects/[id]        → "Exportar KML" → abrir en Google Earth
```
