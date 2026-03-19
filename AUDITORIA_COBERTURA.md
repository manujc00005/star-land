# Auditoría de Cobertura — star-land
> Fecha: 2026-03-19 · Generado tras la segunda iteración de implementación

---

## 1. Cobertura del plan original por módulo

---

### Módulo 1 — Listado de proyectos
**Estado: ✅ COMPLETO**

**Archivo principal:** `src/components/projects/projects-table.tsx`

| Criterio | Evidencia en código | Estado |
|---|---|---|
| Eliminación de columna Acciones | Tipo `ProjectRow` sin campo acciones. No existe columna en `COLUMNS` (línea 22) | ✅ |
| Eliminación de botones Editar/Eliminar | No existe ningún botón de acción en el `<tbody>` (líneas 111–130) | ✅ |
| Fila completa clicable | Línea 115: `router.push(\`/projects/${project.id}\`)` en el `onClick` del `<tr>` | ✅ |
| Buscador general | Líneas 74–82: `<Input>` con `query` state, filtrado en `useMemo` (líneas 44–56) | ✅ |
| Ordenación por columnas | Líneas 35–42: `handleSort` con toggle asc/desc. Iconos `ChevronUp/Down/ChevronsUpDown` | ✅ |
| Preparado para nuevas columnas | Línea 22: array `COLUMNS` configurable con `key`, `label`, `hiddenMobile` | ✅ |

**Criterios que faltan:** Ninguno.

---

### Módulo 2 — Formulario Proyecto V2
**Estado: ✅ COMPLETO**

**Archivo principal:** `src/components/projects/project-form.tsx`

| Criterio | Evidencia en código | Estado |
|---|---|---|
| Tecnología principal + adicionales | Líneas 55–59: `useState<Technology[]>` con mínimo 1 entrada. Lista dinámica con add/remove | ✅ |
| Potencia opcional por tecnología | Líneas 184–204: input `number` con `placeholder="MW (opcional)"` y `powerMW?: undefined` | ✅ |
| Estado: Oportunidad | Enum `OPPORTUNITY` en schema Prisma + `PROJECT_STATUS_LABELS` | ✅ |
| Estado: En Desarrollo | Enum `IN_DEVELOPMENT` | ✅ |
| Estado: RTB | Enum `RTB` | ✅ |
| Estado: En Construcción | Enum `IN_CONSTRUCTION` | ✅ |
| Estado: En Operación | Enum `IN_OPERATION` | ✅ |
| Campo: Puntos de conexión | Líneas 215–254: tags con Enter/coma, estado local `connectionPoints[]` | ✅ |
| Campo: Cluster | Líneas 259–266: `<Input name="cluster">` opcional | ✅ |
| Campo: Desarrollador | Líneas 267–274: `<Input name="developer">` opcional | ✅ |
| Campo: SPV | Líneas 275–282: `<Input name="spv">` opcional | ✅ |
| Guardar sin datos no críticos | Línea 51: `useActionState` sin required en campos opcionales | ✅ |

**Criterios que faltan:** Ninguno.

---

### Módulo 3 — Detalle de proyecto refactorizado
**Estado: ⚠️ PARCIAL**

**Archivos principales:** `src/app/(dashboard)/projects/[id]/page.tsx`, `src/components/projects/geometry-editor.tsx`, `src/components/parcels/parcel-form.tsx`

| Criterio | Evidencia en código | Estado |
|---|---|---|
| Header con búsqueda rápida global | `src/components/layout/header.tsx` + `project-search.tsx` — en layout global | ✅ (preexistente) |
| Bloque fijo de datos generales | `projects/[id]/page.tsx` líneas 180–244: tecnologías, potencia, conexión, SPV | ✅ (preexistente) |
| Tab: Gestión Terrenos | `project-tabs.tsx` — tab activo por defecto | ✅ (preexistente) |
| Tab: Permitting placeholder | `project-tabs.tsx` líneas 424–435: Card con mensaje "Disponible en próxima fase" | ✅ (preexistente) |
| Eliminar bloque visible de GeoJSON | `geometry-editor.tsx` ya no estaba en ninguna ruta activa de proyecto antes de los cambios. Se añadió comentario JSDoc. **No se eliminó nada de UI real.** `parcel-form.tsx` líneas 114–130 **sigue teniendo un textarea GeoJSON activo** en `/parcels/new` y `/parcels/[id]/edit` | ⚠️ PARCIAL |

**Criterios que faltan:**
- Confirmar alcance del requisito "eliminar GeoJSON de la UI": ¿aplica solo a proyectos (ya sin GeoJSON) o también a parcelas (parcel-form.tsx aún activo)?
- Si aplica a parcelas: eliminar o colapsar el textarea de `parcel-form.tsx`

---

### Módulo 4 — Gestión Terrenos
**Estado: ✅ COMPLETO**

**Archivo principal:** `src/components/projects/project-tabs.tsx`

| Criterio | Evidencia en código | Estado |
|---|---|---|
| Tabla de parcelas dentro del proyecto | `project-tabs.tsx` líneas 165–331: tabla completa dentro de la tab Terrenos | ✅ |
| Botón Exportar KML | Líneas 150–154: `<a href="/api/projects/[id]/export/kml" download>` | ✅ |
| Botón + Añadir parcelas | Líneas 156–161: `<Link href="/projects/[id]/parcels">` | ✅ |
| Columna: Municipio | Líneas 197–199 (header) + 243–245 (celda) | ✅ |
| Columna: Referencia Catastral | Líneas 200–202 (header) + 247–255 (celda con link a /parcels/[id]) | ✅ |
| Columna: Superficie | Líneas 203–205 (header) + 257–260 (celda con m²) | ✅ |
| Columna: Estado Contratación | Líneas 206–208 (header) + 262–269 (celda con `ContractingStatusBadge`) | ✅ |
| Columna: Propietario | Líneas 209–211 (header) + 271–283 (celda con link a /owners/[id]) | ✅ |
| Columna: Afección | Líneas 212–214 (header) + 285–292 (celda con `AffectationSelect`) | ✅ |

**Criterios que faltan:** Ninguno.

---

### Módulo 5 — Edición contextual de parcelas
**Estado: ⚠️ PARCIAL**

**Archivo principal:** `src/components/projects/parcels/parcel-panel.tsx`

| Criterio | Evidencia en código | Estado |
|---|---|---|
| Fila desplegable (vs panel lateral) | `project-tabs.tsx` línea 228: `toggleExpand` con `ChevronRight` | ✅ |
| Editar notas de contratación | `parcel-panel.tsx` líneas 60–70: textarea + `updateParcelNotesAction` | ✅ |
| Editar personas relacionadas con rol | `parcel-panel.tsx` líneas 340–440: lista + `createParcelContactAction` / `deleteParcelContactAction` | ✅ |
| Editar estado de contratación (G1) | `parcel-panel.tsx` líneas 72–96: selector DRAFT/ACTIVE/EXPIRED + `updateLinkedContractStatusAction` | ✅ (implementado en última iteración) |
| Asignar propietario sin contrato (G2) | `parcel-panel.tsx` líneas 257–293: selector de owners + `createPanelContractAction` | ✅ (implementado en última iteración) |
| Crear contrato básico (G3) | `parcel-panel.tsx` líneas 318–326: botón "Crear contrato borrador" con tipo seleccionable | ✅ (implementado en última iteración) |
| **Cambiar propietario de contrato existente** | No implementado. El Caso A (líneas 181–253) muestra propietario como texto estático. Sin selector ni acción para cambiarlo. | ❌ NO CUBIERTO |
| **Gestionar múltiples contratos por parcela** | El panel solo recibe el contrato de mayor prioridad (`bestContractByParcel` en page.tsx líneas 84–102). Los contratos adicionales son invisibles en el panel. | ❌ NO CUBIERTO |
| **Eliminar contrato desde el panel** | No existe botón ni acción de borrado de contrato dentro del `ParcelPanel`. | ❌ NO CUBIERTO |

**Criterios que faltan:**
- Cambiar propietario de un contrato ya existente desde el panel
- Gestión de múltiples contratos por parcela en la misma vista
- Opción de eliminar contrato desde el panel (opcional según negocio)

---

### Módulo 6 — Dominio y relaciones
**Estado: ✅ COMPLETO (preexistente, no modificado)**

**Archivo principal:** `prisma/schema.prisma`

| Entidad | Estado en schema | Servicio | Estado servicio |
|---|---|---|---|
| `Project` | ✅ líneas 70–95 | `project.service.ts` | ✅ CRUD completo |
| `Parcel` | ✅ líneas 103–123 | `parcel.service.ts` | ✅ CRUD completo |
| `Owner` | ✅ líneas 37–52 | `owner.service.ts` | ✅ CRUD completo |
| `Contract` | ✅ líneas 170–186 | `contract.service.ts` | ✅ CRUD + `updateContractStatus` nuevo |
| `ParcelContact` (personas relacionadas) | ✅ líneas 194–209 | `parcel-contact.service.ts` | ✅ create/delete/getByParcelIds |
| `ProjectParcel` (relación M:N) | ✅ líneas 130–147 | `project-parcel.service.ts` | ✅ assign/remove/notes/affectation |

**Criterios que faltan:** Ninguno.

---

## 2. Cambios realmente implementados en la última iteración

Solo lo que existe en disco y no existía antes de la iteración:

| Archivo | Cambio real | Tipo |
|---|---|---|
| `src/components/projects/geometry-editor.tsx` | Bloque de comentario JSDoc con estado del componente y TODO | Documentación únicamente — sin cambio funcional |
| `src/services/contract.service.ts` | Nueva función `updateContractStatus(ctx, id, status)` — 14 líneas | Nuevo método de servicio |
| `src/actions/contract.ts` | Nuevo tipo `PanelActionResult`, nuevas funciones `updateLinkedContractStatusAction` y `createPanelContractAction` | Nuevas server actions sin redirect |
| `src/components/projects/project-tabs.tsx` | Nuevo tipo exportado `PanelOwner`, nuevo prop `owners: PanelOwner[]` en `Props`, desestructuración y pase a `<ParcelPanel>` | Extensión de tipos y props |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Import de `getOwners`, añadido al `Promise.all`, construcción de `owners: PanelOwner[]`, prop `owners` a `<ProjectTabs>` | Fetch adicional + pase de datos |
| `src/components/projects/parcels/parcel-panel.tsx` | Reescritura completa: imports nuevos, nuevo prop `owners`, col 2 con G1 (selector de estado de contrato) y G2+G3 (crear contrato desde panel) | Implementación funcional principal |

**Lo que NO se tocó en la última iteración:**
- `prisma/schema.prisma` — sin cambios
- `src/actions/project.ts`, `parcel.ts`, `owner.ts`, `project-parcel.ts`, `parcel-contact.ts` — sin cambios
- `src/components/projects/projects-table.tsx` — sin cambios
- `src/components/projects/project-form.tsx` — sin cambios
- `src/components/parcels/parcel-form.tsx` — sin cambios (GeoJSON activo)
- Todas las rutas de listados, formularios y módulos 1, 2, 4, 6 — sin cambios

---

## 3. Desviaciones respecto al plan

| Desviación | Declarado como | Validado en código real |
|---|---|---|
| Módulos 1, 2, 4, 6 declarados completos sin implementar nada | "Ya implementados en la inspección inicial" | **Sí, validado** — cada criterio se contrastó con líneas de código antes de declararlo |
| Módulo 3: "eliminar GeoJSON de la UI" declarado como resuelto con comentario | "geometry-editor.tsx ya no estaba activo en rutas de proyecto" | **Verdad parcial** — geometry-editor.tsx no estaba en rutas de proyecto (correcto), pero parcel-form.tsx sí tiene textarea GeoJSON activo en rutas de parcela. No se eliminó ningún elemento de UI real. |
| Módulo 5: "cambiar propietario de contrato existente" no implementado | No contemplado explícitamente en el plan de fases | **Gap real no advertido** — el plan decía "asignar propietario" (caso sin contrato) pero no cubrió "cambiar propietario" (caso con contrato existente). Son operaciones distintas. |
| Módulo 5: "múltiples contratos por parcela" no gestionado en el panel | Dejado como riesgo documentado | **Gap arquitectural real** — el modelo Prisma soporta N contratos por parcela, pero el panel solo recibe y gestiona el contrato de mayor prioridad. Los demás son invisibles en el panel. |
| Fase 3 del plan ("TODOs documentados y cierre") | Declarada como ejecutada | **Ejecutada como comentarios en código** — los TODOs de VF1–VF4 están en los archivos modificados, pero no en un documento de seguimiento separado. |

---

## 4. Riesgos funcionales y técnicos introducidos

---

### R1 — Duplicados de contrato al crear desde el panel
**Componente:** `createPanelContractAction` en `src/actions/contract.ts:140–168`

`createContract` no verifica si ya existe un contrato DRAFT o ACTIVE para la misma combinación `(parcelId, ownerId)`. Si el usuario pulsa el botón dos veces antes de que el Server Component revalide la ruta (por red lenta o doble clic), se crean dos contratos idénticos. No hay constraint único en BD para `(parcelId, ownerId)`.

**Severidad:** Media.
**Mitigación disponible:** Añadir check en `contract.service.ts` antes de `createContract`. O deshabilitar el botón durante el `createPending` (ya está implementado vía `disabled={createPending}`). El `disabled` mitiga el doble clic pero no la concurrencia real.

---

### R2 — Estado local del selector no sincronizado tras revalidación del servidor
**Componente:** `parcel-panel.tsx:73` — `useState<ContractStatus>(contractStatus ?? "DRAFT")`

React no reinicializa `useState` al cambiar props en un componente cliente ya montado. Si `contractStatus` llega con un valor nuevo desde el servidor (p. ej. actualizado por otro usuario concurrente), el selector del panel seguirá mostrando el valor local hasta que el usuario recargue la página.

**Severidad:** Baja en uso monousuario. Media en entorno multi-usuario.
**Mitigación disponible:** Añadir `useEffect([contractStatus], () => setLocalStatus(contractStatus ?? "DRAFT"))` — 3 líneas.

---

### R3 — Panel solo gestiona el contrato de mayor prioridad
**Componente:** `projects/[id]/page.tsx:84–102` — lógica `bestContractByParcel`

Cuando una parcela tiene múltiples contratos (p. ej. ACTIVE de arrendamiento + EXPIRED de compraventa anterior), el panel muestra y permite editar solo el ACTIVE. Si el usuario cambia el estado del ACTIVE a EXPIRED desde el panel, en el siguiente render el sistema elegirá el contrato "ganador" entre todos los EXPIRED de esa parcela sin garantía de cuál — la UX puede ser inconsistente.

**Severidad:** Media. El escenario de múltiples contratos por parcela es probable en el negocio real.
**Mitigación disponible:** Mostrar lista completa de contratos de la parcela dentro del panel, con acciones por contrato.

---

### R4 — Cambio de propietario de contrato existente no disponible desde el panel
**Componente:** `parcel-panel.tsx:181–253` — Caso A (cuando `contractId` existe)

El propietario se muestra como texto estático con enlace. Para cambiar el propietario de un contrato ya firmado o en borrador, el usuario debe salir del contexto del proyecto y navegar a `/contracts/[id]/edit`. Esto rompe el flujo operativo del módulo 5.

**Severidad:** Media. El caso de uso "cambiar propietario" es distinto de "asignar propietario por primera vez" y es frecuente en la operativa real (errores de asignación, cambio de titularidad).

---

### R5 — Pérdida del estado de expansión del panel en recargas completas
**Componente:** `project-tabs.tsx:94` — `expandedId` en estado local de cliente

En condiciones normales (revalidación parcial de RSC), el estado `expandedId` se conserva porque `ProjectTabs` no se desmonta. Pero si la revalidación fuerza un reload completo de la página (p. ej. por errores de hidratación), el panel colapsado vuelve a su estado cerrado, perdiendo el contexto del usuario.

**Severidad:** Baja. Comportamiento correcto en el path normal de uso.

---

### R6 — GeoJSON en parcel-form sigue activo sin decisión explícita
**Componente:** `src/components/parcels/parcel-form.tsx:114–130`

El textarea de GeoJSON raw está activo en `/parcels/new` y `/parcels/[id]/edit`. No se tomó ninguna decisión explícita sobre si debe mantenerse, ocultarse o eliminarse. Si el requisito original de "eliminar GeoJSON de la UI" aplica a parcelas además de proyectos, esto es un gap funcional abierto.

**Severidad:** Indeterminada — depende de si el requisito aplica o no a este formulario.

---

## 5. Próximo bloque de implementación recomendado

### Bloque D — Sincronizar estado local con props del servidor (R2)
**Objetivo:** Evitar que el selector de estado del contrato muestre un valor desactualizado tras revalidación del servidor.

**Archivos afectados:**
- `src/components/projects/parcels/parcel-panel.tsx` — añadir `useEffect` de sincronización

**Migraciones:** Ninguna.
**Riesgo:** Muy bajo. Cambio de 3 líneas.
**Dependencias:** Ninguna.

---

### Bloque A — Protección contra duplicados en createPanelContractAction
**Objetivo:** Antes de crear el contrato, verificar si ya existe uno no-EXPIRED para `(parcelId, ownerId)`. Si existe, devolver error descriptivo en lugar de crear duplicado.

**Archivos afectados:**
- `src/services/contract.service.ts` — nueva función `findExistingContract(ctx, parcelId, ownerId)`
- `src/actions/contract.ts` — llamada al check antes de `createContract`

**Migraciones:** Ninguna.
**Riesgo:** Bajo. Operación de solo lectura antes de la escritura.
**Dependencias:** Ninguna.

---

### Bloque B — Cambiar propietario de contrato existente desde el panel
**Objetivo:** En el Caso A del panel (parcela con contrato), añadir un selector de propietario que permita cambiar el `ownerId` del contrato existente.

**Archivos afectados:**
- `src/services/contract.service.ts` — nueva función `updateContractOwner(ctx, id, ownerId)`
- `src/actions/contract.ts` — nueva action `updateLinkedContractOwnerAction(contractId, ownerId, projectId)`
- `src/components/projects/parcels/parcel-panel.tsx` — añadir selector de propietario en Caso A con botón guardar

**Migraciones:** Ninguna.
**Riesgo:** Medio. Cambiar el propietario de un contrato activo tiene implicaciones de negocio (titularidad, firma). Recomendado añadir confirmación explícita antes de la acción.
**Dependencias:** La lista de `owners` ya está disponible en el panel.

---

### Bloque C — Decisión sobre GeoJSON en parcel-form (Módulo 3)
**Objetivo:** Resolver explícitamente si el campo GeoJSON de `parcel-form.tsx` debe mantenerse, ocultarse o eliminarse de la UI de parcelas.

**Archivos afectados:**
- `src/components/parcels/parcel-form.tsx` — eliminar o marcar como sección colapsable el textarea GeoJSON (líneas 114–130)

**Migraciones:** Ninguna. El campo `geometry` existe en BD y se puede seguir poblando via importación CSV.
**Riesgo:** Bajo si se elimina solo de la UI. Medio si los usuarios usaban este campo manualmente para pegar coordenadas.
**Dependencias:** Requiere confirmación del alcance del requisito "eliminar GeoJSON de la UI".

---

### Bloque E — Gestión de múltiples contratos por parcela en el panel (R3)
**Objetivo:** Mostrar la lista completa de contratos de una parcela dentro del panel expandible, no solo el de mayor prioridad. Permitir cambiar el estado de cada uno individualmente.

**Archivos afectados:**
- `src/components/projects/project-tabs.tsx` — extender `TabParcel` para incluir `allContracts[]` en lugar de solo `contractId/contractStatus/contractType`
- `src/app/(dashboard)/projects/[id]/page.tsx` — cambiar la lógica de `bestContractByParcel` para pasar todos los contratos por parcela
- `src/components/projects/parcels/parcel-panel.tsx` — sustituir el Caso A (contrato único) por lista de contratos con acciones por fila

**Migraciones:** Ninguna.
**Riesgo:** Alto. Implica cambiar el tipo `TabParcel` que es el contrato de datos entre el Server Component y múltiples Client Components. Requiere revisión de `ContractingStatusBadge` en la tabla (columna Estado Contratación) para manejar múltiples estados.
**Dependencias:** Bloque B (cambiar propietario) es complementario pero independiente.

---

## Resumen de estado final

| Módulo | Estado | Trabajo pendiente |
|---|---|---|
| 1 — Listado proyectos | ✅ Completo | Ninguno |
| 2 — Formulario proyecto | ✅ Completo | Ninguno |
| 3 — Detalle proyecto | ⚠️ Parcial | Confirmar alcance GeoJSON en parcel-form (Bloque C) |
| 4 — Gestión terrenos | ✅ Completo | Ninguno |
| 5 — Edición panel parcela | ⚠️ Parcial | Bloque D (sync estado), B (cambiar owner), E (múltiples contratos) |
| 6 — Dominio y relaciones | ✅ Completo | Ninguno |

**Riesgos abiertos prioritarios:** R1 (duplicados), R2 (estado desincronizado), R3 (múltiples contratos), R4 (cambio de propietario).
**Bloques recomendados en orden:** D → A → B → C → E
