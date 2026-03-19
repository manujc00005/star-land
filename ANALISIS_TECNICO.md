# Análisis Técnico — star-land
> Fecha: 2026-03-19 · Modelo: Claude Sonnet 4.6

---

## BLOQUE A — INSPECCIÓN

### 1. Resumen del proyecto actual

**star-land** es una aplicación web de gestión de suelo para proyectos de energías renovables. Es un MVP multi-tenant con arquitectura Next.js 15 App Router, Prisma/PostgreSQL y Server Actions. El proyecto está en un estado **significativamente más avanzado de lo que los requisitos sugieren** — la mayoría de lo solicitado ya está implementado.

---

### 2. Stack detectado

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| UI | React | 19 |
| ORM | Prisma | 6.x |
| DB | PostgreSQL (Docker/Neon) | — |
| Auth | NextAuth v5 (beta) | 5.0.0-beta.30 |
| Estilos | Tailwind CSS | v4 |
| Validación | Zod | v4 |
| GIS cliente | Leaflet | 1.9 |
| GIS servidor | @turf/turf | 7.3 |
| Iconos | lucide-react | 0.577 |

---

### 3. Modelos de datos actuales

#### Organization
```
id, name, createdAt, updatedAt
→ users[], owners[], projects[], parcels[], projectParcels[], contracts[], parcelContacts[]
```

#### Project
```
id, name, powerMW (Float?), technologies (Json?), status (ProjectStatus),
connectionPoints (String[]), cluster (String?), developer (String?), spv (String?),
geometry (Json?), organizationId, createdAt, updatedAt
→ projectParcels[]
```

#### ProjectStatus (enum)
```
OPPORTUNITY | IN_DEVELOPMENT | RTB | IN_CONSTRUCTION | IN_OPERATION
```

#### Parcel
```
id, cadastralRef, polygon, parcelNumber, surface (Float), municipality (String?),
landUse (String?), geometry (Json?), organizationId, createdAt, updatedAt
→ projectParcels[], contracts[], contacts[]
@@unique([cadastralRef, organizationId])
```

#### ProjectParcel (M:N Project ↔ Parcel)
```
id, projectId, parcelId, affectation (String?), notes (String?),
organizationId, createdAt
@@unique([projectId, parcelId])
```

#### Owner
```
id, name, nif, address (String?), phone (String?), email (String?),
organizationId, createdAt, updatedAt
→ contracts[]
```

#### Contract
```
id, type (ContractType), status (ContractStatus), price (Float?), signedAt (DateTime?),
parcelId, ownerId, organizationId, createdAt, updatedAt
```

#### ContractType (enum): `RENTAL | PURCHASE`
#### ContractStatus (enum): `DRAFT | ACTIVE | EXPIRED`

#### ParcelContact
```
id, name, role (String), phone (String?), email (String?), notes (String?),
parcelId, organizationId, createdAt, updatedAt
```

#### User
```
id, email (unique), passwordHash, name (String?), organizationId, createdAt, updatedAt
```

---

### 4. Rutas y pantallas activas

#### Rutas públicas
| Ruta | Descripción |
|---|---|
| `GET /` | Redirect a `/dashboard` o `/login` |
| `GET /login` | Página de inicio de sesión |
| `GET /register` | Página de registro |

#### Rutas privadas (protegidas por middleware JWT)
| Ruta | Descripción |
|---|---|
| `GET /dashboard` | Dashboard principal |
| `GET /projects` | Listado de proyectos |
| `GET /projects/new` | Crear proyecto |
| `GET /projects/[id]` | Detalle de proyecto (tabs) |
| `GET /projects/[id]/edit` | Editar proyecto |
| `GET /projects/[id]/parcels` | Asignar parcelas al proyecto |
| `GET /parcels` | Listado de parcelas |
| `GET /parcels/new` | Crear parcela |
| `GET /parcels/[id]` | Detalle de parcela |
| `GET /parcels/[id]/edit` | Editar parcela |
| `GET /parcels/import` | Importar parcelas CSV |
| `GET /owners` | Listado de propietarios |
| `GET /owners/new` | Crear propietario |
| `GET /owners/[id]/edit` | Editar propietario |
| `GET /contracts` | Listado de contratos |
| `GET /contracts/new` | Crear contrato |
| `GET /contracts/[id]` | Detalle de contrato |
| `GET /contracts/[id]/edit` | Editar contrato |
| `GET /settings` | Configuración (vacía) |

#### API Routes
| Ruta | Descripción |
|---|---|
| `GET /api/projects/search?q=` | Búsqueda autocompletar para el header |
| `GET /api/projects/[id]/export/kml` | Exportar geometría KML |
| `/api/auth/[...nextauth]` | NextAuth endpoints |

---

### 5. Componentes relevantes

#### Layout
- `src/components/layout/header.tsx` — Header global con búsqueda de proyectos
- `src/components/layout/sidebar.tsx` — Menú lateral de navegación
- `src/components/layout/project-search.tsx` — Autocompletar `/api/projects/search`

#### Proyectos
- `src/components/projects/projects-table.tsx` — Tabla con buscador + sorting
- `src/components/projects/project-form.tsx` — Formulario crear/editar
- `src/components/projects/project-tabs.tsx` — Tabs detalle (Terrenos + Permitting)
- `src/components/projects/project-status-badge.tsx` — Badge de estado
- `src/components/projects/geometry-editor.tsx` — Editor GeoJSON raw (⚠️ ver gap G3)
- `src/components/projects/detect-parcels-button.tsx` — Cruce espacial automático
- `src/components/projects/delete-project-button.tsx` — Eliminar proyecto

#### Parcelas (dentro de proyecto)
- `src/components/projects/parcels/parcel-panel.tsx` — Panel expandible por fila
- `src/components/projects/parcels/affectation-select.tsx` — Select de afección inline
- `src/components/projects/parcels/assign-parcel-button.tsx` — Asignar parcela
- `src/components/projects/parcels/remove-parcel-button.tsx` — Desasignar parcela

#### Parcelas (módulo propio)
- `src/components/parcels/parcel-form.tsx` — Formulario parcela
- `src/components/parcels/import/csv-upload-form.tsx` — Upload CSV
- `src/components/parcels/import/import-preview.tsx` — Preview antes de importar
- `src/components/parcels/import/import-result.tsx` — Resultado de importación

#### Contratos, Propietarios
- `src/components/contracts/contract-form.tsx`
- `src/components/contracts/contract-status-badge.tsx`
- `src/components/contracts/contract-type-badge.tsx`
- `src/components/owners/owner-form.tsx`

#### Mapa
- `src/components/map/geo-map.tsx` — Componente Leaflet (client-side)
- `src/components/map/geo-map-loader.tsx` — Loader con SSR fallback

---

### 6. Server Actions existentes

| Archivo | Actions |
|---|---|
| `src/actions/auth.ts` | `loginAction`, `registerAction`, `logoutAction` |
| `src/actions/project.ts` | `createProjectAction`, `updateProjectAction`, `deleteProjectAction`, `updateProjectGeometryAction` |
| `src/actions/parcel.ts` | `createParcelAction`, `updateParcelAction`, `deleteParcelAction` |
| `src/actions/owner.ts` | `createOwnerAction`, `updateOwnerAction`, `deleteOwnerAction` |
| `src/actions/contract.ts` | `createContractAction`, `updateContractAction`, `deleteContractAction` |
| `src/actions/project-parcel.ts` | `assignParcelAction`, `removeParcelAction`, `updateAffectationAction`, `updateParcelNotesAction`, `detectParcelsAction` |
| `src/actions/parcel-contact.ts` | `createParcelContactAction`, `deleteParcelContactAction` |
| `src/actions/parcel-import.ts` | `analyzeCSVAction`, `importParcelsAction` |

---

### 7. Servicios de negocio (capa de dominio)

Todos los servicios reciben `AuthContext { userId, organizationId }` para garantizar multi-tenancy.

| Servicio | Operaciones principales |
|---|---|
| `project.service.ts` | `getProjects`, `getProjectById`, `createProject`, `updateProject`, `deleteProject`, `updateProjectGeometry` |
| `parcel.service.ts` | `getParcels`, `getParcelById`, `createParcel`, `updateParcel`, `deleteParcel` |
| `project-parcel.service.ts` | `getProjectParcels`, `assignParcel`, `removeParcel`, `updateParcelAffectation`, `updateParcelNotes`, `assignParcelsToProject` (cruce espacial) |
| `contract.service.ts` | `getContracts`, `getContractsByParcel`, `getContractsByProject`, `createContract`, `updateContract`, `deleteContract` |
| `owner.service.ts` | `getOwners`, `getOwnerById`, `createOwner`, `updateOwner`, `deleteOwner` |
| `parcel-contact.service.ts` | `createParcelContact`, `deleteParcelContact`, `getContactsByParcelIds` |

---

### 8. Estado real de cada módulo solicitado

#### Módulo 1 — Listado de proyectos
**Estado: ✅ COMPLETAMENTE IMPLEMENTADO**

`src/components/projects/projects-table.tsx` ya tiene:
- Sin columna Acciones ni botones editar/eliminar en el listado
- Fila completa clicable (`router.push`)
- Buscador general (filtra por nombre, potencia, estado, fecha)
- Sorting bidireccional por todas las columnas con iconos visuales
- Arquitectura preparada para nuevas columnas (array `COLUMNS` configurable)

> **No hay nada que implementar en este módulo.**

---

#### Módulo 2 — Formulario Proyecto V2
**Estado: ✅ COMPLETAMENTE IMPLEMENTADO**

`src/components/projects/project-form.tsx` ya tiene:
- Lista dinámica de tecnologías (tipo + potencia MW opcional por tecnología)
- Enum `ProjectStatus` con los 5 estados exactos: `OPPORTUNITY`, `IN_DEVELOPMENT`, `RTB`, `IN_CONSTRUCTION`, `IN_OPERATION`
- Campos opcionales: `connectionPoints` (tags con Enter/coma), `cluster`, `developer`, `spv`
- Proyectos guardables aunque falten datos opcionales

> **No hay nada que implementar en este módulo.**

---

#### Módulo 3 — Detalle de proyecto
**Estado: ⚠️ MAYORITARIAMENTE IMPLEMENTADO — 1 gap**

`src/app/(dashboard)/projects/[id]/page.tsx` ya tiene:
- ✅ Búsqueda rápida global en el header del layout
- ✅ Bloque fijo de datos generales (tecnologías, potencia total, puntos de conexión, SPV)
- ✅ Tabs: `Gestión Terrenos` + `Permitting` (placeholder)

**Gap G3:** El componente `GeometryEditor` (`src/components/projects/geometry-editor.tsx`) expone un `Textarea` con el GeoJSON raw. Actualmente no está incluido en la vista detalle ni en la página de edición de proyecto (fue eliminado de las rutas activas en una refactorización previa). **Necesita auditarse en `parcel-form.tsx`** para confirmar si está activo en alguna ruta visible.

---

#### Módulo 4 — Gestión Terrenos
**Estado: ✅ COMPLETAMENTE IMPLEMENTADO**

`src/components/projects/project-tabs.tsx` ya tiene:
- Tabla de parcelas con las 6 columnas solicitadas: Municipio, Ref. Catastral, Superficie, Estado Contratación, Propietario, Afección
- Botón `Exportar KML`
- Botón `+ Añadir parcelas` → `/projects/[id]/parcels`
- Panel expandible por fila (chevron expand)

> **No hay nada que implementar en este módulo.**

---

#### Módulo 5 — Edición contextual de parcelas
**Estado: 🔴 PARCIALMENTE IMPLEMENTADO — 3 gaps**

`src/components/projects/parcels/parcel-panel.tsx` ya tiene:
- ✅ Notas de contratación editables con guardado inline
- ✅ Personas relacionadas con rol (crear y eliminar desde el panel)
- ✅ Propietario visible con enlace al detalle

**Gaps:**

| # | Gap | Impacto |
|---|---|---|
| **G1** | No se puede cambiar el estado de contratación desde el panel. El badge es solo lectura. Para cambiar el estado hay que ir al formulario de contrato en `/contracts/[id]/edit`. | Alto — flujo operativo cortado |
| **G2** | No se puede asignar o cambiar propietario desde el panel. Si la parcela no tiene propietario asignado, el panel dice "Sin propietario registrado" sin posibilidad de acción. | Alto — bloquea flujo de contratación |
| **G3** | No se puede crear o vincular un contrato directamente desde el panel. Solo muestra el contrato existente con enlace externo. | Medio — requiere salir del contexto |

---

#### Módulo 6 — Dominio y relaciones
**Estado: ✅ COMPLETAMENTE IMPLEMENTADO**

Schema Prisma contiene: `Project`, `Parcel`, `ProjectParcel`, `Owner`, `Contract`, `ParcelContact`. Todas las relaciones y servicios CRUD existen. `ParcelContact` cubre las "personas relacionadas con rol". No se necesita ninguna migración nueva.

> **No hay nada que implementar en este módulo.**

---

### 9. Patrones de diseño detectados

| Patrón | Descripción |
|---|---|
| **Multi-tenancy** | `organizationId` nunca viene del cliente, siempre se extrae del JWT. Todos los servicios filtran por org. |
| **Server Actions + useActionState** | Formularios sin fetch/axios manual. Validación Zod en servidor. Estados de error/éxito integrados (React 19). |
| **AuthContext** | `{ userId, organizationId }` pasado a cada servicio. Garantiza filtrado correcto. |
| **Validación en capas** | Cliente (Zod) → Servidor (re-validación) → BD (constraints unique/FK) |
| **Geometría como Json?** | GeoJSON almacenado en campo Json Prisma. Turf.js en servidor. Sin PostGIS por ahora. |

---

### 10. Riesgos identificados

| # | Riesgo | Severidad | Descripción |
|---|---|---|---|
| R1 | NextAuth v5 beta inestable | Media | La API puede cambiar antes de la versión estable |
| R2 | `GeometryEditor` sin uso activo | Baja | Componente huérfano que puede confundir al equipo |
| R3 | Acciones inline desde el panel | Media | El flujo de asignar propietario/contrato desde el panel requiere nuevas server actions — no hay forma de hacerlo sin extender el código |
| R4 | Contactos globales vs por proyecto | Baja | `ParcelContact` está vinculado a `Parcel` (global), no a `ProjectParcel`. Los mismos contactos aparecen en todos los proyectos que comparten esa parcela |
| R5 | KML exporta recinto del proyecto, no parcelas individuales | Baja | El botón "Exportar KML" en la tabla de terrenos exporta el polígono del proyecto completo, no las geometrías individuales de cada parcela |

---

### 11. Vacíos funcionales que requieren confirmación

| # | Vacío | Pregunta pendiente |
|---|---|---|
| VF1 | **Estado de contratación editable** | ¿Cambiar el "estado de contratación" desde el panel = cambiar `Contract.status` del contrato vinculado? ¿O es un estado nuevo independiente en `ProjectParcel`? |
| VF2 | **Asignar propietario desde el panel** | ¿Asignar propietario implica crear siempre un `Contract` DRAFT, o se quiere una relación directa `ProjectParcel → Owner` sin contrato? |
| VF3 | **GeometryEditor en UI activa** | ¿El editor de GeoJSON raw debe eliminarse de todas las vistas, o solo del detalle de proyecto? ¿Se mantiene en la edición de parcela? |
| VF4 | **Contactos por parcela vs por proyecto** | Los contactos son globales de la parcela (visibles en todos sus proyectos). ¿Es correcto, o deben ser contextuales por proyecto? |
| VF5 | **Alcance del KML exportado** | ¿El KML de terrenos debe exportar las geometrías de las parcelas individuales, o el recinto global del proyecto? |

---

---

## BLOQUE B — PLAN MAESTRO

### 1. Diagnóstico consolidado

El proyecto está en estado MVP avanzado y sólido. Los módulos 1, 2, 4 y 6 están completamente implementados y no requieren trabajo. Los módulos 3 y 5 tienen gaps menores y muy concretos. No se necesitan migraciones de base de datos.

---

### 2. Plan por fases

#### Fase 1 — Auditoría y limpieza (bajo riesgo)
- Localizar todas las referencias activas a `GeometryEditor` en la UI
- Si está activo en alguna ruta, evaluar si eliminar o marcar con `TODO`
- Confirmar alcance de VF3 con el cliente antes de actuar
- **Sin migraciones. Sin nuevos componentes.**

#### Fase 2 — Extensión del ParcelPanel (foco principal)
- **G1:** Añadir selector inline del estado del contrato vinculado (`DRAFT` / `ACTIVE` / `EXPIRED`)
- **G2:** Añadir selector de propietario (`Owner`) con búsqueda, para asignar/cambiar el propietario de la parcela en el contexto del proyecto
- **G3:** Añadir flujo mínimo de creación de contrato básico directamente desde el panel
- Nuevas server actions en `contract.ts` y/o `project-parcel.ts`
- Pasar lista de owners al componente desde la page (fetch en servidor)

#### Fase 3 — TODOs documentados y cierre
- Documentar VF4 (contactos globales vs por proyecto) con `TODO` en el código
- Documentar VF5 (alcance KML) en el componente de exportación
- Documentar R4 en el schema de Prisma
- Asegurar que no hay componentes huérfanos

---

### 3. Orden de ejecución recomendado

```
① Auditar GeometryEditor                          → confirmar impacto → limpiar si procede
② Añadir server action: updateContractStatus      → cambio de estado inline del contrato
③ Añadir server action: createBasicContract       → crear contrato DRAFT desde el panel
④ Extender page /projects/[id] con fetch de owners → pasar al panel
⑤ Extender ParcelPanel con controles G1, G2, G3   → implementación principal
⑥ Documentar TODOs residuales                    → VF4, VF5, R4, R5
```

---

### 4. Impacto técnico transversal

| Dimensión | Impacto |
|---|---|
| **Migraciones BD** | Ninguna — el schema cubre todo |
| **Nuevas rutas** | Ninguna — todo es inline en el panel existente |
| **Layout / Header / Sidebar** | Sin cambios |
| **Módulos no implicados** | Parcelas, Owners, Contratos (módulos propios), Auth, CSV import — intactos |
| **Ruta afectada** | Solo `projects/[id]` (a través del panel expandible) |
| **Riesgo de rotura** | Bajo — el panel es un componente hoja sin dependencias upstream complejas |

---

### 5. Archivos previsiblemente afectados

```
src/
├── actions/
│   └── contract.ts                              → nueva action createBasicContractAction
│                                                   nueva action updateContractStatusAction
├── services/
│   └── (sin cambios — getOwners y createContract ya existen)
├── components/
│   ├── projects/
│   │   ├── parcels/
│   │   │   └── parcel-panel.tsx                 ← CAMBIO PRINCIPAL
│   │   └── geometry-editor.tsx                  → auditar / limpiar si procede
│   └── parcels/
│       └── parcel-form.tsx                      → auditar si tiene GeometryEditor activo
└── app/(dashboard)/projects/[id]/page.tsx       → añadir fetch de owners para el panel
```

**Archivos que NO deben tocarse salvo confirmación explícita:**
- `prisma/schema.prisma` — no se necesitan migraciones
- Rutas de contratos, parcelas, owners — módulos independientes
- `projects-table.tsx`, `project-form.tsx` — ya completos
- `project-tabs.tsx` — ya completo (tabla de terrenos)

---

### 6. Riesgos de implementación

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| VF1 sin respuesta: ambigüedad en estado de contratación | Media | Implementar como cambio de `Contract.status`. Documentar decisión con `TODO`. |
| VF2 sin respuesta: asignar owner sin contrato | Media | Requerir contrato DRAFT mínimo. Marcar con `TODO: confirmar si se quiere relación directa sin contrato`. |
| Panel con demasiados controles inline | Baja | Mantener la estructura de 3 columnas existente. Añadir controles solo donde ya hay sección. |
| Server actions con datos obsoletos | Baja | Usar `revalidatePath` en todas las nuevas actions — ya es el patrón del proyecto. |

---

### 7. Preguntas pendientes (requieren respuesta antes de implementar Fase 2)

> Las respuestas a estas preguntas determinan cómo se implementa el módulo 5.

1. **VF1** — ¿Cambiar el "estado de contratación" en el panel = cambiar `Contract.status`?
2. **VF2** — ¿Asignar propietario desde el panel implica crear un `Contract` DRAFT, o quieres relación directa sin contrato?
3. **VF3** — ¿El `GeometryEditor` (textarea GeoJSON raw) debe eliminarse de toda la UI, incluyendo la edición de parcela?
4. **VF4** — ¿Los contactos de parcela deben ser globales (actual) o contextuales por proyecto?

---

## Resumen ejecutivo

| Módulo | Estado actual | Trabajo pendiente |
|---|---|---|
| 1 — Listado proyectos | ✅ Completo | Ninguno |
| 2 — Formulario proyecto | ✅ Completo | Ninguno |
| 3 — Detalle proyecto | ⚠️ 95% completo | Auditar GeometryEditor (G3) |
| 4 — Gestión terrenos | ✅ Completo | Ninguno |
| 5 — Edición panel parcela | 🔴 60% completo | Gaps G1, G2, G3 |
| 6 — Dominio y relaciones | ✅ Completo | Ninguno |

**El proyecto está en muy buen estado. El trabajo real es acotado y de bajo riesgo.**
