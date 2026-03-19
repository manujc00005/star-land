# Especificación Funcional — StarLand

> **Versión:** 1.0 · **Fecha:** 2026-03-19
> **Autor:** Análisis funcional automático basado en inspección exhaustiva del código fuente
> **Propósito:** Revisión funcional, QA manual, refinamiento de backlog, validación con negocio

---

## Índice

1. [Mapa global de funcionalidades](#1-mapa-global-de-funcionalidades)
2. [Flujos completos de usuario por módulo](#2-flujos-completos-de-usuario-por-módulo)
3. [Flujos clave end-to-end](#3-flujos-clave-end-to-end)
4. [Estados funcionales del dominio](#4-estados-funcionales-del-dominio)
5. [Matriz de acciones por pantalla](#5-matriz-de-acciones-por-pantalla)
6. [Validaciones funcionales esperadas](#6-validaciones-funcionales-esperadas)
7. [Huecos funcionales, contradicciones y pendientes](#7-huecos-funcionales-contradicciones-y-pendientes)
8. [Priorización funcional recomendada](#8-priorización-funcional-recomendada)

---

## 1. Mapa global de funcionalidades

### 1.1 Módulos y pantallas detectados

| # | Módulo / Pantalla | Propósito | Usuario | Entidad principal |
|---|---|---|---|---|
| 1 | Login | Autenticación con email y contraseña | Todos | User |
| 2 | Registro | Alta de organización + usuario inicial | Usuario nuevo | Organization + User |
| 3 | Dashboard | Vista resumen con métricas y actividad reciente | Técnico / gestor | Organization |
| 4 | Listado de proyectos | Acceso y navegación a todos los proyectos de la org | Técnico / gestor | Project |
| 5 | Creación de proyecto | Formulario para dar de alta un nuevo proyecto | Técnico | Project |
| 6 | Detalle de proyecto | Vista principal del proyecto con datos fijos y tabs de gestión | Técnico / gestor | Project |
| 7 | Tab Gestión de Terrenos | Gestión de parcelas asignadas: negociación, contratos, afección, notas, contactos | Gestor terrenos | ProjectParcel |
| 8 | Tab Permitting | Placeholder para expedientes y licencias (no activo) | — | — |
| 9 | Edición de proyecto | Formulario para modificar datos de un proyecto | Técnico | Project |
| 10 | Gestión de parcelas del proyecto | Pantalla dedicada para asignar / desasignar parcelas manualmente | Gestor terrenos | ProjectParcel |
| 11 | Panel de parcela (inline) | Panel expandible en la tabla de terrenos con todas las acciones contextuales | Gestor terrenos | ProjectParcel / Contract |
| 12 | Listado de parcelas | Catálogo de parcelas catastrales de la organización | Técnico | Parcel |
| 13 | Creación de parcela | Alta manual de una parcela catastral | Técnico | Parcel |
| 14 | Detalle de parcela | Datos de la parcela, contratos y proyectos asociados | Técnico | Parcel |
| 15 | Edición de parcela | Modificación de datos de una parcela | Técnico | Parcel |
| 16 | Importación CSV de parcelas | Importación masiva de parcelas desde fichero CSV con preview y validación | Técnico | Parcel |
| 17 | Listado de propietarios | Catálogo de propietarios de la organización | Gestor terrenos | Owner |
| 18 | Creación de propietario | Alta de un propietario (persona física o jurídica) | Gestor terrenos | Owner |
| 19 | Edición de propietario | Modificación de datos de un propietario | Gestor terrenos | Owner |
| 20 | Listado de contratos | Vista global de contratos con filtros por tipo y estado | Gestor terrenos | Contract |
| 21 | Creación de contrato | Formulario completo para crear un contrato | Gestor terrenos | Contract |
| 22 | Detalle de contrato | Ficha completa de un contrato con datos, parcela y propietario | Gestor terrenos | Contract |
| 23 | Edición de contrato | Modificación de datos de un contrato | Gestor terrenos | Contract |
| 24 | Exportación KML | Descarga de geometría del proyecto y sus parcelas como KML | Técnico GIS | Project |
| 25 | Búsqueda global de proyectos | Búsqueda rápida mediante API para navegación directa | Todos | Project |
| 26 | Configuración | Datos de organización y listado de miembros (MVP) | Administrador | Organization |

---

## 2. Flujos completos de usuario por módulo

---

### MÓDULO A — Autenticación

---

## A1. Inicio de sesión

### Objetivo del usuario
Acceder a la aplicación con sus credenciales.

### Punto de entrada
URL directa `/login` o redirección automática al intentar acceder a cualquier ruta protegida sin sesión.

### Precondiciones
- El usuario debe estar previamente registrado.
- La organización debe existir.

### Paso a paso
1. El usuario accede a `/login`.
2. Ve el formulario con campos: **Email** y **Contraseña**.
3. Introduce sus datos y pulsa **Iniciar sesión**.
4. El sistema valida formato (email válido, contraseña no vacía).
5. Si hay error de formato: muestra mensaje inline sin llamar al servidor.
6. Si el formato es válido: envía la acción `loginAction`.
7. El servidor valida credenciales contra la base de datos (bcrypt).
8. Si las credenciales son incorrectas: devuelve error genérico (sin indicar cuál campo falla, por seguridad).
9. Si las credenciales son correctas: crea sesión JWT con `userId` y `organizationId`, redirige a `/dashboard`.

### Acciones posibles del usuario
- Rellenar y enviar el formulario.
- Pulsar el enlace "¿No tienes cuenta? Regístrate" → navega a `/register`.

### Validaciones / restricciones
- Email: formato válido (Zod).
- Contraseña: mínimo 1 carácter (Zod, solo presencia).
- Credenciales: validadas con bcrypt en servidor.

### Estados posibles
- Formulario vacío (initial).
- Formulario con error de validación (cliente).
- Enviando (pending, durante la llamada al servidor).
- Error de credenciales (error devuelto por servidor).
- Sesión activa → redirigido a dashboard.

### Resultados esperados
- Sesión JWT activa.
- Redirección a `/dashboard`.
- Sidebar con nombre de la organización visible.

### Errores / excepciones
- Credenciales incorrectas: mensaje de error genérico.
- Usuario no encontrado: mismo mensaje genérico (no revelar que el email no existe).
- Error de base de datos: mensaje de error genérico.

### Dependencias
- Módulo de sesión JWT (NextAuth).
- Tabla `users` en base de datos.

### Observaciones
- No hay recuperación de contraseña (pendiente de implementar).
- No hay autenticación de dos factores (no planificado en MVP).
- No hay bloqueo por intentos fallidos.

---

## A2. Registro de organización y usuario

### Objetivo del usuario
Crear una cuenta nueva con su organización asociada.

### Punto de entrada
Enlace desde `/login` o acceso directo a `/register`.

### Precondiciones
- El email no debe estar ya registrado en el sistema.

### Paso a paso
1. El usuario accede a `/register`.
2. Ve el formulario con: **Nombre de la organización**, **Tu nombre**, **Email**, **Contraseña**.
3. Rellena todos los campos y pulsa **Crear cuenta**.
4. El sistema valida: org (2-100 chars), nombre (2-100 chars), email (válido), contraseña (≥8 chars).
5. Si hay error de formato: muestra mensajes inline.
6. Si el email ya existe: devuelve error del servidor.
7. Si todo es válido: crea `Organization`, crea `User` (con bcrypt hash), inicia sesión automáticamente.
8. Redirige a `/dashboard`.

### Acciones posibles del usuario
- Rellenar y enviar el formulario.
- Ir a "¿Ya tienes cuenta? Inicia sesión" → navega a `/login`.

### Validaciones / restricciones
- Nombre de organización: 2-100 caracteres.
- Nombre de usuario: 2-100 caracteres.
- Email: formato válido.
- Contraseña: mínimo 8 caracteres.
- Email único en el sistema (global, no por organización).

### Estados posibles
- Formulario vacío.
- Con errores de validación.
- Enviando.
- Error por email duplicado.
- Cuenta creada → sesión iniciada → redirigido.

### Resultados esperados
- Organización creada.
- Usuario creado y autenticado.
- Sesión JWT activa.
- Redirección a `/dashboard`.

### Errores / excepciones
- Email ya registrado: error del servidor.
- Validación de campos: errores inline.

### Dependencias
- Ninguna previa (es el punto de entrada al sistema).

### Observaciones
- No hay invitación de usuarios adicionales a la organización en el flujo actual.
- Los usuarios adicionales de la misma org solo pueden crearse si se comparte el email/pass o mediante una futura funcionalidad de invitación (pendiente de implementar).
- No hay validación de que el NIF de la organización sea único (pendiente).

---

### MÓDULO B — Dashboard

---

## B1. Visualización del dashboard

### Objetivo del usuario
Obtener una vista rápida del estado general de su organización.

### Punto de entrada
Menú lateral → Dashboard, o redirección tras login.

### Precondiciones
- Usuario autenticado con sesión activa.

### Paso a paso
1. El usuario accede a `/dashboard`.
2. Ve un saludo con su nombre y el nombre de la organización.
3. Visualiza 4 tarjetas de métricas: número de Proyectos, Parcelas, Propietarios y Contratos.
4. Ve una sección de actividad reciente (proyectos u operaciones recientes).
5. Puede pulsar cualquier tarjeta de métrica para navegar al módulo correspondiente.

### Acciones posibles del usuario
- Clic en tarjeta "Proyectos" → navega a `/projects`.
- Clic en tarjeta "Parcelas" → navega a `/parcels`.
- Clic en tarjeta "Propietarios" → navega a `/owners`.
- Clic en tarjeta "Contratos" → navega a `/contracts`.
- Navegación mediante sidebar a cualquier módulo.

### Validaciones / restricciones
- Solo muestra datos de la organización del usuario (multi-tenancy).

### Estados posibles
- Cargando (SSR, no debería ser visible).
- Dashboard con datos.
- Dashboard sin datos (estado vacío de la organización).

### Resultados esperados
- Vista rápida con métricas reales.

### Errores / excepciones
- Error de sesión: redirección a `/login`.

### Dependencias
- Servicio de organización para métricas.

### Observaciones
- La sección de "actividad reciente" no está completamente especificada (pendiente de refinamiento).
- Las métricas son conteos, no tienen drill-down desde las tarjetas con filtro aplicado.

---

### MÓDULO C — Proyectos

---

## C1. Listado de proyectos

### Objetivo del usuario
Ver todos los proyectos de su organización y navegar a uno concreto.

### Punto de entrada
Menú lateral → Proyectos.

### Precondiciones
- Usuario autenticado.

### Paso a paso
1. El usuario accede a `/projects`.
2. Ve el encabezado con botón **+ Nuevo proyecto**.
3. Si hay proyectos: ve la tabla con columnas — Nombre, Estado, Potencia MW, Nº Parcelas, Nº Contratos.
4. Si no hay proyectos: ve estado vacío con invitación a crear el primero.
5. Pulsa una fila o el nombre del proyecto para ir a su detalle.

### Acciones posibles del usuario
- Clic en **+ Nuevo proyecto** → navega a `/projects/new`.
- Clic en nombre/fila del proyecto → navega a `/projects/[id]`.
- (Búsqueda global de proyectos disponible desde el header).

### Validaciones / restricciones
- Solo se muestran proyectos de la organización del usuario.
- No hay paginación explícita en el MVP (carga todos).

### Estados posibles
- Lista con proyectos.
- Lista vacía.

### Resultados esperados
- Tabla de proyectos con acceso directo a cada ficha.

### Errores / excepciones
- Error de carga: página de error de Next.js.

### Dependencias
- `getProjects(ctx)` en project.service.

### Observaciones
- No hay búsqueda/filtrado en la tabla de proyectos (pendiente).
- No hay ordenación en la tabla (pendiente).
- No hay paginación para organizaciones con muchos proyectos (pendiente).

---

## C2. Creación de proyecto

### Objetivo del usuario
Dar de alta un nuevo proyecto de energía renovable con sus datos básicos.

### Punto de entrada
Botón **+ Nuevo proyecto** en `/projects`.

### Precondiciones
- Usuario autenticado.

### Paso a paso
1. El usuario accede a `/projects/new`.
2. Ve el formulario `ProjectForm` con los siguientes campos:
   - **Nombre del proyecto** (obligatorio)
   - **Tecnologías** (mínimo 1, array dinámico): tipo de tecnología (texto libre con sugerencias) y potencia MW (opcional por tecnología)
   - **Estado** (selector: OPPORTUNITY, IN_DEVELOPMENT, RTB, IN_CONSTRUCTION, IN_OPERATION)
   - **Puntos de conexión** (tag input, opcional)
   - **Cluster** (texto libre, opcional)
   - **Promotor / Developer** (texto libre, opcional)
   - **SPV** (texto libre, opcional)
3. Puede añadir más filas de tecnología con el botón **+ Añadir tecnología**.
4. Puede eliminar filas de tecnología con el botón X en cada fila.
5. Puede añadir puntos de conexión como tags (texto + Enter o coma como separador).
6. Pulsa **Crear proyecto**.
7. El sistema valida y crea el proyecto.
8. Si hay errores de validación: muestra mensajes inline.
9. Si es correcto: redirige a `/projects/[id]`.

### Acciones posibles del usuario
- Añadir filas de tecnología.
- Eliminar filas de tecnología.
- Añadir/eliminar puntos de conexión.
- Seleccionar estado del proyecto.
- Cancelar (navegar hacia atrás).

### Validaciones / restricciones
- Nombre: obligatorio, máximo 200 caracteres.
- Tecnologías: mínimo 1 tecnología requerida.
- Tipo de tecnología: texto libre, mínimo 1 carácter. Hay un `datalist` con sugerencias: Fotovoltaica, Eólico, Almacenamiento (BESS), Termosolar, Hidráulica, Biomasa, Otro.
- Potencia MW por tecnología: número positivo, opcional.
- Estado: debe ser uno de los 5 valores del enum.
- El campo `powerMW` del proyecto se calcula automáticamente como suma de todas las potencias MW de las tecnologías.
- Los datos de tecnologías y puntos de conexión se serializan como JSON en campos ocultos antes de enviar.

### Estados posibles
- Formulario vacío (initial).
- Con errores de validación.
- Enviando (pending).
- Proyecto creado → redirigido al detalle.

### Resultados esperados
- Proyecto creado en BD con `organizationId` del usuario.
- `powerMW` calculado como suma de tecnologías.
- Redirección al detalle del proyecto.

### Errores / excepciones
- Nombre vacío: error de validación.
- Sin tecnologías: error de validación.
- Error de BD: mensaje de error genérico.

### Dependencias
- Ninguna previa (entidad raíz).

### Observaciones
- Las sugerencias de tecnología son un `datalist`, no un enum. El usuario puede escribir cualquier cosa.
- No hay validación de que la potencia total tenga sentido respecto al tipo de tecnología.
- No hay geometría en la creación; se añade posteriormente desde el editor de geometría en el detalle.

---

## C3. Detalle de proyecto

### Objetivo del usuario
Ver toda la información de un proyecto y gestionar sus parcelas, contratos y datos.

### Punto de entrada
Clic en un proyecto desde `/projects` o redirección tras creación.

### Precondiciones
- El proyecto debe existir y pertenecer a la organización del usuario.

### Paso a paso
1. El usuario accede a `/projects/[id]`.
2. Ve el encabezado con:
   - Botón **← Proyectos** (volver al listado).
   - Nombre del proyecto (título H1).
   - Badge de estado del proyecto.
   - Botones: **Descargar KML**, **Editar**, **Eliminar**.
3. Si el proyecto tiene tecnologías, potencia, puntos de conexión o SPV: ve un bloque fijo de datos clave con iconos.
4. Ve las tabs disponibles: **Gestión Terrenos** (activa por defecto) y **Permitting** (placeholder).
5. En la tab **Gestión Terrenos**:
   - Si hay parcelas con geometría o el proyecto tiene geometría: ve el mapa interactivo.
   - Ve la barra de herramientas: botón **Detectar parcelas**, **Exportar KML**, **+ Añadir parcelas**.
   - Ve la tabla de parcelas asignadas.
   - Ve la tabla de contratos del proyecto.
6. En la tab **Permitting**: mensaje de "próxima fase".

### Acciones posibles del usuario
- Volver al listado de proyectos.
- Descargar KML del proyecto.
- Editar el proyecto.
- Eliminar el proyecto (con confirmación).
- Detectar parcelas automáticamente (requiere geometría del proyecto).
- Exportar KML.
- Añadir parcelas manualmente → navega a `/projects/[id]/parcels`.
- Expandir/colapsar filas de parcela en la tabla.
- Gestionar afección de cada parcela (inline dropdown).
- Abrir el panel detallado de cada parcela.
- Navegar a la ficha de una parcela.
- Navegar a la ficha de un contrato.
- Ver contratos del proyecto en la tabla inferior.

### Validaciones / restricciones
- El proyecto debe pertenecer a la organización del usuario.
- La detección automática de parcelas requiere que el proyecto tenga geometría válida.
- Solo se muestra el bloque de datos fijos si hay al menos un campo con valor.

### Estados posibles
- Cargando (SSR).
- Con datos.
- Sin parcelas asignadas.
- Sin geometría de proyecto.
- Con mapa visible (si hay geometría).

### Resultados esperados
- Vista completa del proyecto con mapa, parcelas y contratos.

### Errores / excepciones
- Proyecto no encontrado o no de la org: 404.
- Error en detección espacial: mensaje de error en el botón.

### Dependencias
- `getProjectById`, `getProjectParcels`, `getContractsByProject`, `getOwners`, `getContactsByParcelIds`.

### Observaciones
- El mapa colorea las parcelas: verde (con contrato), naranja (sin contrato). Criterio visual basado en existencia de contrato, no en el estado de negociación.
- El bloque de datos fijos es estático (solo lectura) y no directamente editable desde el detalle.
- La tab "Permitting" no tiene funcionalidad; es un placeholder visible pero no activo.

---

## C4. Edición de proyecto

### Objetivo del usuario
Modificar los datos generales de un proyecto existente.

### Punto de entrada
Botón **Editar** en el detalle del proyecto.

### Precondiciones
- El proyecto debe existir y pertenecer a la org.

### Paso a paso
1. El usuario accede a `/projects/[id]/edit`.
2. Ve el mismo formulario `ProjectForm` con los valores actuales precargados.
3. Modifica los campos que desea.
4. Pulsa **Guardar cambios**.
5. El sistema valida y actualiza el proyecto.
6. Si hay errores: muestra mensajes inline.
7. Si es correcto: revalida el detalle y redirige a `/projects/[id]`.

### Acciones posibles del usuario
- Modificar cualquier campo.
- Añadir/eliminar tecnologías.
- Añadir/eliminar puntos de conexión.
- Cancelar (navegar hacia atrás, sin guardar).

### Validaciones / restricciones
- Mismas que en creación.

### Estados posibles
- Formulario con datos cargados.
- Con errores de validación.
- Enviando.
- Guardado → redirigido al detalle.

### Resultados esperados
- Proyecto actualizado en BD.
- `powerMW` recalculado.
- Redirección al detalle.

### Errores / excepciones
- Proyecto no encontrado: 404.
- Validaciones fallidas: errores inline.

### Dependencias
- `getProjectById` para cargar datos.

### Observaciones
- La geometría NO se edita desde este formulario. Se gestiona separadamente desde el editor de geometría en el detalle.
- No hay historial de cambios (pendiente).

---

## C5. Eliminación de proyecto

### Objetivo del usuario
Eliminar un proyecto de la organización.

### Punto de entrada
Botón **Eliminar** en el detalle del proyecto.

### Precondiciones
- El proyecto debe existir y pertenecer a la org.

### Paso a paso
1. El usuario pulsa el botón **Eliminar** (representado como `DeleteProjectButton`).
2. Aparece un diálogo de confirmación.
3. Si confirma: ejecuta `deleteProjectAction`.
4. El sistema elimina el proyecto (cascada a projectParcels).
5. Revalida `/projects` y redirige al listado.

### Validaciones / restricciones
- Requiere confirmación explícita.
- La eliminación es irreversible.
- Cascada: se eliminan todas las relaciones `ProjectParcel` (pero no las parcelas ni los contratos individuales — **pendiente de verificar comportamiento real**).

### Estados posibles
- Botón disponible.
- Diálogo de confirmación abierto.
- Eliminando (pending).
- Eliminado → redirigido al listado.

### Resultados esperados
- Proyecto eliminado de BD.
- Redirección a `/projects`.

### Errores / excepciones
- Error de BD: mensaje de error.

### Dependencias
- Ninguna especial (solo la sesión activa).

### Observaciones
- **Riesgo funcional importante:** Al eliminar un proyecto, las `ProjectParcel` se eliminan en cascada. Los contratos vinculados a esas parcelas (que son a nivel de parcela, no de proyecto) **NO se eliminan** (el contrato vive en `Parcel`, no en `ProjectParcel`). Esto puede generar contratos huérfanos sin proyecto de referencia visible. Pendiente de decisión de negocio.

---

## C6. Exportación KML

### Objetivo del usuario
Descargar la geometría del proyecto y sus parcelas en formato KML para uso en SIG externo (Google Earth, QGIS, etc.).

### Punto de entrada
- Botón **KML** en el encabezado del detalle del proyecto.
- Botón **Exportar KML** dentro de la tab Gestión Terrenos.

### Precondiciones
- Proyecto debe tener geometría o parcelas con geometría para que el KML tenga contenido útil.
- No es un bloqueo técnico: si no hay geometría, se descarga un KML vacío.

### Paso a paso
1. El usuario pulsa el botón KML.
2. El navegador realiza una petición GET a `/api/projects/[id]/export/kml`.
3. El servidor genera el fichero KML con la geometría del proyecto y la de cada parcela asignada.
4. El navegador descarga el fichero `.kml`.

### Acciones posibles del usuario
- Abrir el fichero KML en su herramienta GIS.
- Compartirlo con terceros.

### Validaciones / restricciones
- Solo accesible para usuarios autenticados de la organización propietaria del proyecto.

### Estados posibles
- Descarga en curso (navegador).
- Descarga completada.

### Resultados esperados
- Fichero `.kml` descargado con geometría del proyecto y parcelas.

### Errores / excepciones
- Proyecto sin geometría: KML se genera pero puede no contener features útiles.
- Error de servidor: error HTTP.

### Dependencias
- Módulo KML generator (`src/lib/kml`).
- Geometría del proyecto y parcelas.

### Observaciones
- No se especifica el nombre del fichero descargado (puede ser genérico).
- El KML no incluye datos alfanuméricos de contratos ni propietarios, solo geometría.

---

### MÓDULO D — Gestión de Terrenos (Tab en detalle de proyecto)

---

## D1. Tabla de parcelas en el proyecto

### Objetivo del usuario
Ver todas las parcelas asignadas al proyecto y su estado de negociación.

### Punto de entrada
Tab "Gestión Terrenos" en el detalle del proyecto.

### Precondiciones
- El proyecto debe tener parcelas asignadas.

### Paso a paso
1. El usuario ve la tabla de parcelas con columnas:
   - Flecha de expansión (toggle panel).
   - Municipio.
   - Referencia Catastral (enlace a ficha de parcela).
   - Superficie en m².
   - **Estado de Contratación** (badge derivado de `NegotiationStatus`).
   - Propietario (del contrato principal).
   - Afección (dropdown inline).
   - Botón eliminar parcela del proyecto.
2. Puede expandir/colapsar el panel detallado de cada parcela.
3. Puede cambiar la afección directamente desde el dropdown inline.

### Acciones posibles del usuario
- Expandir panel de parcela (toggle chevron).
- Clic en referencia catastral → navega a `/parcels/[id]`.
- Cambiar afección (inline, con guardado automático).
- Eliminar parcela del proyecto (con confirmación).

### Validaciones / restricciones
- La afección es opcional y tiene valores predefinidos: Planta, Aerogenerador, Línea de alta tensión, Subestación, Baterías, Vial de acceso, Otra.
- Solo un panel de parcela expandido a la vez.

### Estados posibles
- Tabla vacía (sin parcelas).
- Tabla con datos.
- Fila con panel colapsado.
- Fila con panel expandido (muestra el ParcelPanel).

### Resultados esperados
- Vista rápida del estado de negociación de cada parcela.

### Errores / excepciones
- Error al cambiar afección: estado visual de error pendiente de revisión.

### Dependencias
- `ProjectParcel` con datos de `Parcel`, `NegotiationStatus`, contratos y contactos.

### Observaciones
- El badge "Estado de Contratación" muestra el **estado de negociación** (`NegotiationStatus`), no el estado del contrato legal. Este es el comportamiento correcto y deliberado del dominio rediseñado.
- El mapa de leyenda todavía dice "Con contrato / Sin contrato" y se basa en la existencia de contratos, no en el NegotiationStatus. Hay inconsistencia visual.

---

## D2. Detección automática de parcelas (cruce espacial)

### Objetivo del usuario
Asignar automáticamente al proyecto todas las parcelas de la organización que geográficamente intersectan con el recinto del proyecto.

### Punto de entrada
Botón **Detectar parcelas** en la barra de herramientas de la tab Gestión Terrenos.

### Precondiciones
- El proyecto debe tener geometría (GeoJSON Polygon o MultiPolygon) definida.
- Debe haber parcelas con geometría en la organización.

### Paso a paso
1. El usuario pulsa **Detectar parcelas**.
2. El sistema ejecuta `detectParcelsAction(projectId)`.
3. Se obtiene la geometría del proyecto y se valida.
4. Se obtienen todas las parcelas de la organización con geometría.
5. Para cada parcela: se comprueba intersección geométrica con Turf.js `booleanIntersects`.
6. Las parcelas que intersectan y no estaban asignadas se crean como `ProjectParcel`.
7. Se devuelve un resumen: parcelas analizadas, intersectadas, creadas, ya existentes, sin geometría, errores.
8. Se muestra el resumen al usuario (toast o sección expandida).
9. La tabla de parcelas se actualiza con las nuevas asignaciones.

### Acciones posibles del usuario
- Pulsar el botón.
- Ver el resumen de resultados.
- (No hay paso de confirmación previo a la asignación masiva).

### Validaciones / restricciones
- El proyecto debe tener geometría válida; si no, la acción devuelve error.
- Las parcelas sin geometría se ignoran (contabilizadas como `skippedNoGeometry`).
- Las parcelas ya asignadas no generan duplicados (`skipDuplicates`).
- Límite de rendimiento MVP: en memoria, adecuado para <10.000 parcelas.

### Estados posibles
- Botón en espera.
- Detectando (pending, botón desactivado).
- Resultado de éxito con resumen.
- Error (proyecto sin geometría u otro fallo).

### Resultados esperados
- Nuevas relaciones `ProjectParcel` creadas.
- Tabla de parcelas actualizada.
- Resumen legible con conteos.

### Errores / excepciones
- Sin geometría de proyecto: error con mensaje descriptivo ("Añade el recinto del proyecto primero").
- Geometría de parcela inválida: esa parcela se cuenta en `errors` y se omite.
- Error de BD: mensaje de error genérico.

### Dependencias
- Geometría del proyecto.
- Parcelas de la organización con geometría.
- Turf.js para intersección.

### Observaciones
- **Riesgo funcional:** No hay confirmación previa. Si el usuario tiene el recinto mal definido, puede asignar parcelas incorrectas sin aviso.
- No hay opción de "deshacer" la detección masiva.
- Con PostGIS futuro, este proceso será mucho más rápido y escalable.

---

## D3. Asignación manual de parcelas al proyecto

### Objetivo del usuario
Asignar manualmente parcelas específicas al proyecto sin usar el cruce espacial.

### Punto de entrada
Botón **+ Añadir parcelas** en la tab Gestión Terrenos → navega a `/projects/[id]/parcels`.

### Precondiciones
- Deben existir parcelas en la organización que no estén ya asignadas al proyecto.

### Paso a paso
1. El usuario accede a `/projects/[id]/parcels`.
2. Ve dos secciones:
   - **Parcelas asignadas**: tabla de las ya vinculadas con botón de desasignación.
   - **Añadir parcelas**: campo de búsqueda + tabla de resultados de parcelas disponibles.
3. Escribe en el campo de búsqueda para filtrar parcelas disponibles (por referencia catastral, número de polígono o número de parcela).
4. Pulsa **Asignar** en la parcela que desea añadir.
5. El sistema crea la relación `ProjectParcel`.
6. La parcela desaparece de "disponibles" y aparece en "asignadas".

### Acciones posibles del usuario
- Buscar parcelas disponibles.
- Asignar parcela (botón por fila).
- Desasignar parcela ya asignada (botón por fila, con confirmación).
- Volver al detalle del proyecto.

### Validaciones / restricciones
- La búsqueda es insensible a mayúsculas, busca en referencia catastral, número de polígono y número de parcela.
- Si la búsqueda está vacía, muestra las primeras 30 parcelas disponibles.
- No se puede asignar la misma parcela dos veces (restricción de BD `@@unique([projectId, parcelId])`).

### Estados posibles
- Sin parcelas disponibles.
- Con parcelas disponibles listadas.
- Asignando (pending).
- Desasignando (pending).

### Resultados esperados
- Parcela asignada o desasignada correctamente.
- Tabla actualizada.

### Errores / excepciones
- Parcela no encontrada o no de la org: error 404 (en la acción).
- Duplicado (edge case): protegido por la restricción de BD.

### Dependencias
- Catálogo de parcelas de la organización.

### Observaciones
- El cálculo de superficie total de las parcelas asignadas se muestra en esta pantalla.
- No hay filtro por municipio u otros campos en la búsqueda (solo texto libre en los tres campos).

---

## D4. Panel expandible de parcela (ParcelPanel)

### Objetivo del usuario
Gestionar en detalle el estado de negociación, notas, contratos y personas relacionadas de una parcela en el contexto del proyecto.

### Punto de entrada
Clic en el chevron de expansión de cualquier fila de parcela en la tabla de Gestión Terrenos.

### Precondiciones
- La parcela debe estar asignada al proyecto.

### Paso a paso
1. El usuario expande la fila de una parcela.
2. Ve el panel con 3 columnas:
   - **Columna 1: Estado de negociación + Notas**
   - **Columna 2: Contratos**
   - **Columna 3: Personas relacionadas**

### Columna 1 — Estado de negociación + Notas

3. Ve un selector desplegable con los 8 estados de negociación:
   - SEARCHING → "Buscando"
   - NEGOTIATING → "En negociación"
   - ACCEPTED → "Acuerdo verbal"
   - SIGNED → "Firmado"
   - NOT_NEGOTIATING → "No negocia"
   - COMPETITION → "Competencia"
   - DUPLICATE → "Duplicado"
   - TERMINATED → "Cerrado"
4. Cambia el estado y pulsa **Guardar**.
5. El sistema actualiza `ProjectParcel.negotiationStatus`.
6. Ve también un textarea de notas de contratación.
7. Escribe notas y pulsa **Guardar notas**.

### Columna 2 — Contratos

**Caso A — Sin contratos:**
8. Ve el formulario para crear un contrato borrador:
   - Selector de propietario (de la organización).
   - Selector de tipo: Arrendamiento / Compraventa.
   - Botón **Crear contrato borrador**.
9. Si no hay propietarios: ve mensaje y enlace "Crear propietario →".

**Caso B — Con contratos (ACTIVE o DRAFT):**
8. Ve la lista de contratos activos/borrador. Para cada uno:
   - Nombre del propietario (enlace).
   - Tipo de contrato.
   - Badge de estado legal (DRAFT / ACTIVE / EXPIRED).
   - Precio si existe.
   - Enlace "Ver →" al detalle del contrato.
   - Opción "Cambiar estado" (toggle inline):
     - Selector de estado legal.
     - Botón OK para guardar.
     - Botón X para cancelar.
9. Si hay contratos EXPIRED: ve enlace "Ver contratos expirados (N)" colapsable.
10. Al expandir: lista de contratos expirados (sin opción de editar estado).
11. Ve opción **+ Añadir contrato** para crear contratos adicionales (inline, mismo formulario).

### Columna 3 — Personas relacionadas

12. Ve el listado de contactos de la parcela (global para la parcela, visible en todos los proyectos).
13. Puede añadir un nuevo contacto pulsando **+ Añadir**.
14. Aparece un formulario inline: Nombre*, Rol*, Teléfono, Email, Notas.
15. Pulsa **Guardar contacto**.
16. Puede eliminar un contacto con el botón de papelera (aparece en hover).

### Acciones posibles del usuario
- Cambiar y guardar estado de negociación.
- Guardar notas de contratación.
- Crear contrato borrador desde el panel.
- Cambiar estado legal de un contrato existente.
- Ver detalle completo del contrato.
- Ver/ocultar contratos expirados.
- Añadir contrato adicional.
- Añadir contacto.
- Eliminar contacto.

### Validaciones / restricciones
- Estado de negociación: debe ser uno de los 8 valores del enum.
- Botón "Guardar" de estado de negociación desactivado si el valor no ha cambiado.
- Crear contrato: requiere propietario seleccionado.
- No se pueden crear contratos duplicados DRAFT o ACTIVE para la misma combinación parcelId + ownerId.
- Al pasar un contrato a estado ACTIVE: el sistema automáticamente establece el estado de negociación como SIGNED (regla D2).
- Los contactos son globales de la parcela (no por proyecto).

### Estados posibles
- Columna 1: estado guardado / pendiente de guardar / guardando / guardado (✓ temporal).
- Columna 2: sin contratos / con contratos / creando borrador / editando estado.
- Columna 3: sin contactos / con contactos / formulario de añadir abierto.

### Resultados esperados
- Estado de negociación actualizado.
- Notas guardadas.
- Contrato creado o actualizado.
- Contacto añadido o eliminado.

### Errores / excepciones
- Contrato duplicado: mensaje de error inline con descripción del conflicto.
- Error al guardar estado: mensaje de error debajo del selector.
- Sin propietarios en la org: mensaje informativo con enlace de creación.

### Dependencias
- Propietarios de la organización (para crear contratos).
- Contratos existentes de la parcela.
- Contactos de la parcela.

### Observaciones
- El estado de negociación y el estado legal del contrato son conceptos separados e independientes en el dominio. El primero refleja el avance operativo; el segundo, el estado jurídico.
- La única conexión automática es: contrato → ACTIVE implica negociación → SIGNED.
- Los contactos son globales de la parcela, no específicos del proyecto. Esto puede generar confusión si la parcela participa en múltiples proyectos.
- No hay validación de que el contrato tenga precio o fecha de firma al pasar a ACTIVE.

---

### MÓDULO E — Parcelas

---

## E1. Listado de parcelas

### Objetivo del usuario
Ver el catálogo de parcelas de la organización.

### Punto de entrada
Menú lateral → Parcelas.

### Precondiciones
- Usuario autenticado.

### Paso a paso
1. El usuario accede a `/parcels`.
2. Ve encabezado con botones **+ Nueva parcela** e **Importar CSV**.
3. Ve tabla con columnas: Referencia Catastral, Polígono, Número de parcela, Superficie, Uso del suelo.
4. Puede pulsar cualquier fila para ver el detalle de la parcela.

### Acciones posibles del usuario
- Clic en **+ Nueva parcela** → navega a `/parcels/new`.
- Clic en **Importar CSV** → navega a `/parcels/import`.
- Clic en una parcela → navega a `/parcels/[id]`.
- Clic en **Editar** (botón por fila) → navega a `/parcels/[id]/edit`.
- Clic en **Eliminar** (botón por fila, con confirmación).

### Validaciones / restricciones
- Solo se muestran parcelas de la organización.

### Observaciones
- No hay búsqueda ni filtrado en el listado (pendiente).
- No hay paginación (pendiente).
- No se muestra municipio en la tabla (pendiente de revisión).

---

## E2. Creación manual de parcela

### Objetivo del usuario
Dar de alta una nueva parcela catastral.

### Punto de entrada
Botón **+ Nueva parcela** en `/parcels`.

### Precondiciones
- Usuario autenticado.

### Paso a paso
1. El usuario accede a `/parcels/new`.
2. Ve el formulario `ParcelForm` con campos:
   - **Referencia catastral** (obligatorio, máx. 50 chars)
   - **Polígono** (obligatorio, máx. 50 chars — número de polígono catastral)
   - **Número de parcela** (obligatorio, máx. 50 chars)
   - **Superficie en m²** (obligatorio, número positivo)
   - **Uso del suelo** (opcional, máx. 200 chars)
   - **GeoJSON de geometría** (opcional, textarea con JSON)
3. Rellena los campos y pulsa **Crear parcela**.
4. El sistema valida y crea la parcela.
5. Si hay error de referencia catastral duplicada: muestra error.
6. Si es correcto: redirige al listado o detalle.

### Validaciones / restricciones
- Referencia catastral única por organización (restricción de BD `@@unique([cadastralRef, organizationId])`).
- Superficie: número positivo.
- GeoJSON: si se introduce, debe ser un Polygon o MultiPolygon válido.

### Errores / excepciones
- Referencia catastral duplicada en la organización: error claro.
- GeoJSON inválido: error de parsing.

### Observaciones
- La geometría se introduce como JSON crudo en un textarea. No hay editor visual de mapas.
- El campo "municipio" no aparece en el formulario manual pero sí en la importación CSV.

---

## E3. Importación CSV de parcelas

### Objetivo del usuario
Importar un lote de parcelas desde un fichero CSV con validación previa.

### Punto de entrada
Botón **Importar CSV** en `/parcels`.

### Precondiciones
- El usuario debe tener un fichero CSV en el formato esperado.

### Paso a paso
1. El usuario accede a `/parcels/import`.
2. Ve el paso 1: **Subir fichero CSV**.
3. Selecciona el fichero y pulsa **Analizar**.
4. El sistema ejecuta `analyzeCSVAction`:
   - Lee el CSV.
   - Valida cada fila con Zod.
   - Detecta duplicados dentro del propio CSV.
   - Consulta la BD para detectar referencias ya existentes en la organización.
   - Clasifica filas en: válidas/insertables, inválidas (con error), duplicadas en CSV, ya existentes en BD.
5. Muestra el paso 2: **Preview de importación**:
   - Resumen (total filas, insertables, inválidas, duplicadas, ya en BD).
   - Tabla de filas válidas a importar.
   - Tabla de filas con error (con descripción del error por columna).
6. El usuario revisa y, si está conforme, pulsa **Confirmar importación**.
7. El sistema ejecuta `importParcelsAction`:
   - Re-verifica en BD para protección contra condiciones de carrera.
   - Inserta en bloque las filas válidas.
8. Muestra el paso 3: **Resultado**:
   - Filas insertadas.
   - Filas omitidas (duplicadas, inválidas, ya existentes).
9. El usuario puede volver al listado de parcelas.

### Acciones posibles del usuario
- Seleccionar fichero.
- Analizar.
- Revisar preview.
- Confirmar importación o cancelar.
- Ver resultados y navegar al listado.

### Validaciones / restricciones
- Tamaño máximo del fichero: 900 KB.
- Máximo 2.000 filas por importación.
- Cada fila debe tener: referencia catastral, polígono, número de parcela, superficie (número).
- La referencia catastral debe ser única dentro del CSV y también dentro de la organización en BD.

### Estados posibles
- Paso 1: Subida de fichero.
- Paso 2: Preview (analizando / resultado del análisis).
- Paso 3: Resultado de importación.
- Error: fichero inválido, demasiado grande, etc.

### Resultados esperados
- Parcelas válidas creadas en BD.
- Resumen de filas procesadas.

### Errores / excepciones
- Fichero demasiado grande (>900KB): error antes de procesar.
- Demasiadas filas (>2000): error.
- Formato CSV incorrecto: error de parsing.
- Duplicados en CSV: marcados como error en preview.
- Referencia ya en BD: marcada como "ya existente", no se inserta.

### Dependencias
- Ninguna especial (solo sesión activa).

### Observaciones
- El formato exacto del CSV (columnas, separador, cabeceras) no está documentado en la interfaz (pendiente añadir plantilla de descarga o documentación del formato).
- No hay mapeo de columnas (el formato es fijo, no configurable).
- No hay soporte para actualizar parcelas existentes vía CSV (solo inserción).

---

## E4. Detalle de parcela

### Objetivo del usuario
Ver la información completa de una parcela y sus relaciones.

### Punto de entrada
Clic en una parcela desde el listado o desde la tabla de parcelas de un proyecto.

### Paso a paso
1. El usuario accede a `/parcels/[id]`.
2. Ve datos de la parcela: referencia catastral, polígono, número, superficie, municipio, uso del suelo, geometría.
3. Ve los contratos asociados a la parcela (histórico completo).
4. Ve los proyectos en los que está incluida esta parcela.
5. Puede navegar a editar la parcela o a los contratos/proyectos asociados.

### Acciones posibles del usuario
- Editar parcela.
- Eliminar parcela.
- Navegar a un contrato asociado.
- Navegar a un proyecto asociado.

### Observaciones
- La geometría se muestra posiblemente como JSON crudo o en un mapa (pendiente de confirmar el componente exacto).

---

### MÓDULO F — Propietarios

---

## F1. Listado de propietarios

### Objetivo del usuario
Ver el catálogo de propietarios de la organización.

### Punto de entrada
Menú lateral → Propietarios.

### Paso a paso
1. El usuario accede a `/owners`.
2. Ve la tabla de propietarios con: Nombre, NIF, Email, Teléfono.
3. Puede editar o eliminar cada propietario.
4. Puede crear uno nuevo.

### Acciones posibles del usuario
- **+ Nuevo propietario** → navega a `/owners/new`.
- Editar propietario → navega a `/owners/[id]/edit`.
- Eliminar propietario (con confirmación).

### Observaciones
- No hay detalle de propietario (solo edición). Pendiente de valorar si se necesita una ficha individual.
- Al eliminar un propietario, sus contratos se eliminan en cascada (pérdida de datos contractuales).

---

## F2. Creación y edición de propietario

### Objetivo del usuario
Dar de alta o modificar un propietario.

### Formulario
- **Nombre** (obligatorio, máx. 200 chars).
- **NIF** (obligatorio, máx. 20 chars — sin validación de formato de NIF/CIF).
- **Dirección** (opcional, máx. 500 chars).
- **Teléfono** (opcional, máx. 20 chars).
- **Email** (opcional, formato email válido o vacío).

### Validaciones / restricciones
- NIF no tiene validación de formato (cualquier texto hasta 20 chars).
- No hay validación de unicidad de NIF (pueden existir propietarios con el mismo NIF — posible error de datos).

### Observaciones
- La falta de validación de NIF es un riesgo funcional significativo en una aplicación de gestión de contratos.

---

### MÓDULO G — Contratos

---

## G1. Listado de contratos

### Objetivo del usuario
Ver todos los contratos de la organización con posibilidad de filtrar.

### Punto de entrada
Menú lateral → Contratos.

### Paso a paso
1. El usuario accede a `/contracts`.
2. Ve encabezado con **+ Nuevo contrato**.
3. Ve controles de filtro: **Tipo** (Todos / Arrendamiento / Compraventa) y **Estado** (Todos / Borrador / Activo / Expirado).
4. Ve la tabla de contratos: Parcela, Tipo, Estado, Propietario, Precio, Fecha firma.
5. Puede navegar al detalle de un contrato.

### Acciones posibles del usuario
- Filtrar por tipo.
- Filtrar por estado.
- Clic en contrato → navega a `/contracts/[id]`.
- **+ Nuevo contrato** → navega a `/contracts/new`.

### Observaciones
- Los filtros son acumulables (tipo + estado simultáneamente).
- No hay búsqueda por texto libre (pendiente).
- No hay paginación (pendiente).

---

## G2. Creación de contrato (formulario completo)

### Objetivo del usuario
Crear un contrato completo desde el módulo de contratos (no desde el panel de parcela).

### Punto de entrada
Botón **+ Nuevo contrato** en `/contracts`.

### Formulario
- **Parcela** (obligatorio, selector de parcelas de la org).
- **Propietario** (obligatorio, selector de propietarios de la org).
- **Tipo** (obligatorio: Arrendamiento / Compraventa).
- **Estado** (obligatorio: Borrador / Activo / Expirado).
- **Precio** (opcional, número ≥ 0).
- **Fecha de firma** (opcional, selector de fecha).

### Validaciones / restricciones
- Parcela y propietario deben pertenecer a la organización del usuario.
- No hay validación de duplicados en esta ruta (solo en el panel de parcela).
- No hay validación de que la parcela no tenga ya un contrato ACTIVE con otro propietario.

### Resultados esperados
- Contrato creado.
- Redirección a `/contracts`.

### Errores / excepciones
- Parcela/propietario no de la org: error de servidor.
- Validaciones de campos: errores inline.

### Observaciones
- La ausencia de validación de duplicados en esta ruta es una inconsistencia respecto al panel de parcela (donde sí existe).
- No hay auto-set de negociación status al crear un contrato ACTIVE desde este formulario (solo funciona desde el panel de parcela).

---

## G3. Detalle de contrato

### Objetivo del usuario
Ver los detalles completos de un contrato.

### Punto de entrada
Clic en un contrato desde el listado o desde el panel de parcela.

### Paso a paso
1. El usuario accede a `/contracts/[id]`.
2. Ve: tipo, estado, precio, fecha de firma, parcela (enlace), propietario (enlace).
3. Puede editar o eliminar el contrato.

### Acciones posibles del usuario
- **Editar** → navega a `/contracts/[id]/edit`.
- **Eliminar** (con confirmación).
- Navegar a la ficha de la parcela.
- Navegar a la ficha del propietario.

### Observaciones
- La edición de estado desde aquí no sincroniza el `NegotiationStatus` del `ProjectParcel` (solo lo hace el panel de parcela). Inconsistencia funcional pendiente de decisión.

---

## G4. Edición de contrato

### Objetivo del usuario
Modificar los datos de un contrato existente.

### Formulario
- Mismo que creación, con valores precargados.

### Observaciones
- Cambiar el estado a ACTIVE desde aquí no actualiza el `NegotiationStatus` en los proyectos donde esté la parcela. Ver sección 7 de huecos funcionales.

---

### MÓDULO H — Búsqueda global de proyectos

---

## H1. Búsqueda rápida de proyectos

### Objetivo del usuario
Encontrar y navegar a un proyecto específico sin pasar por el listado completo.

### Punto de entrada
Campo de búsqueda en el header de la aplicación.

### Paso a paso
1. El usuario escribe en el campo de búsqueda del header.
2. El sistema hace llamadas a `/api/projects/search?q=[texto]` mientras el usuario escribe (debounced).
3. Se muestran resultados de proyectos que coinciden con el texto.
4. El usuario pulsa un resultado y navega a `/projects/[id]`.

### Acciones posibles del usuario
- Escribir en el campo de búsqueda.
- Seleccionar un resultado de la lista.
- Vaciar el campo (cierra resultados).

### Validaciones / restricciones
- Solo muestra proyectos de la organización del usuario.
- El campo de búsqueda filtra por nombre de proyecto.

### Observaciones
- El número máximo de resultados devueltos no está especificado en el análisis.
- No está claro si la búsqueda es también por estado, potencia u otros campos.

---

### MÓDULO I — Configuración

---

## I1. Configuración de la organización

### Objetivo del usuario
Ver y gestionar los datos de la organización y sus miembros.

### Punto de entrada
Menú lateral → Configuración.

### Paso a paso
1. El usuario accede a `/settings`.
2. Ve datos de la organización (nombre, fecha de creación).
3. Ve el listado de miembros (nombre, email, fecha de alta).
4. En MVP: no hay opciones de edición de la organización ni de invitación de usuarios.

### Observaciones
- Esta sección es un placeholder de MVP. Las funcionalidades de gestión de organización (edición de nombre, invitación de usuarios, roles) están pendientes.

---

## 3. Flujos clave end-to-end

---

## E2E-1. Crear un proyecto desde cero hasta tener una parcela negociada con contrato activo

### Objetivo de negocio
Documentar el ciclo completo de trabajo de un gestor de terrenos desde la creación del proyecto hasta el cierre de la negociación de una parcela.

### Pasos principales
1. Crear propietario (`/owners/new`) — si no existe.
2. Crear o importar la parcela catastral (`/parcels/new` o `/parcels/import`).
3. Crear el proyecto (`/projects/new`) con nombre, tecnología y estado.
4. Añadir geometría al proyecto (editor GeoJSON en el detalle).
5. Detectar parcelas automáticamente (botón "Detectar parcelas") o asignarlas manualmente (`/projects/[id]/parcels`).
6. En la tabla de Gestión Terrenos: expandir el panel de la parcela.
7. Col 1: Cambiar estado de negociación a "En negociación" (NEGOTIATING).
8. Col 2: Crear contrato borrador (seleccionar propietario + tipo).
9. Gestionar la negociación: actualizar notas, añadir personas relacionadas.
10. Cuando se llega a acuerdo verbal: cambiar negociación a "Acuerdo verbal" (ACCEPTED).
11. Cuando se firma: cambiar el estado legal del contrato a ACTIVE → el sistema automáticamente actualiza la negociación a SIGNED.
12. Verificar en el listado que el badge muestra "Firmado".

### Módulos implicados
Owners → Parcelas → Proyectos → Detalle de proyecto → Panel de parcela → Contratos

### Datos que se crean o modifican
- `Owner`, `Parcel`, `Project`, `ProjectParcel`, `Contract`, `ParcelContact` (opcional).
- `ProjectParcel.negotiationStatus` (varios estados a lo largo del flujo).
- `Contract.status` (DRAFT → ACTIVE).

### Posibles bloqueos
- Sin propietarios: no se puede crear el contrato desde el panel.
- Sin geometría de proyecto: no funciona la detección automática.
- Contrato DRAFT ya existente para parcelId + ownerId: bloquea la creación de uno nuevo.

### Impacto si falla
- Si la sincronización ACTIVE → SIGNED falla: el badge no refleja el estado real, requiere corrección manual.
- Si el contrato no se puede crear: el gestor no puede avanzar en el flujo de negociación desde el panel.

---

## E2E-2. Importar parcelas masivamente y asignarlas a un proyecto

### Objetivo de negocio
Cargar un lote de parcelas catastrales y asignarlas a un proyecto de forma eficiente.

### Pasos principales
1. Preparar fichero CSV con las parcelas.
2. Ir a `/parcels/import` y subir el CSV.
3. Revisar el preview: verificar filas válidas, identificar errores.
4. Si hay errores en el CSV: corregir el fichero y volver a subir.
5. Confirmar la importación.
6. Ir al proyecto correspondiente en `/projects/[id]`.
7. Si el proyecto tiene geometría: usar "Detectar parcelas" para asignación automática.
8. Si no: ir a `/projects/[id]/parcels` y asignar manualmente.

### Módulos implicados
Parcelas (importación) → Proyectos (detección espacial o asignación manual)

### Datos que se crean o modifican
- `Parcel[]` (múltiples).
- `ProjectParcel[]` (múltiples).

### Posibles bloqueos
- CSV con formato incorrecto: no se puede procesar.
- Fichero >900KB o >2000 filas: rechazado.
- Parcelas sin geometría: no participan en la detección automática.

### Impacto si falla
- Si la importación falla parcialmente: las filas válidas se insertan, las inválidas no. El usuario debe gestionar los errores manualmente.

---

## E2E-3. Buscar un proyecto y revisar su estado de contratación

### Objetivo de negocio
Monitorizar el avance de negociación de un proyecto desde el listado.

### Pasos principales
1. Usar la búsqueda global del header para escribir el nombre del proyecto.
2. Seleccionar el proyecto en los resultados.
3. En el detalle, ir a la tab "Gestión Terrenos".
4. Revisar la columna "Estado Contratación" (badges de NegotiationStatus) para cada parcela.
5. Identificar parcelas en estados críticos (COMPETITION, NOT_NEGOTIATING, etc.).
6. Expandir los paneles de las parcelas problemáticas para ver notas y contratos.

### Módulos implicados
Búsqueda global → Detalle de proyecto → Tab Gestión Terrenos → Panel de parcela

### Datos que se crean o modifican
- Solo lectura (no se modifica nada si el usuario solo revisa).

### Posibles bloqueos
- Ninguno específico.

---

## E2E-4. Gestionar contratos desde el módulo de contratos

### Objetivo de negocio
Crear, revisar y actualizar contratos de forma centralizada desde el módulo de contratos.

### Pasos principales
1. Ir a `/contracts`.
2. Filtrar por estado DRAFT para ver contratos pendientes.
3. Clic en un contrato para ver su detalle.
4. Editar el contrato para añadir precio y fecha de firma.
5. Cambiar el estado a ACTIVE.
6. **Nota:** Este cambio NO sincroniza automáticamente el NegotiationStatus del ProjectParcel (solo lo hace el panel de parcela). Pendiente de decisión.

### Módulos implicados
Contratos → Parcelas → (Proyectos afectados)

### Posibles bloqueos
- La falta de sincronización automática desde este flujo puede generar inconsistencias de estado.

---

## 4. Estados funcionales del dominio

---

### 4.1 Proyecto

| Estado | Valor | Label | Descripción funcional |
|---|---|---|---|
| Oportunidad | OPPORTUNITY | Oportunidad | Proyecto en fase inicial de identificación |
| En Desarrollo | IN_DEVELOPMENT | En Desarrollo | Proyecto activo en desarrollo |
| Listo para Construir | RTB | Ready to Build | Proyecto con todos los permisos |
| En Construcción | IN_CONSTRUCTION | En Construcción | Obras en curso |
| En Operación | IN_OPERATION | En Operación | Planta operativa |

**Transiciones permitidas:** Cualquier estado → cualquier estado (sin restricciones de flujo en el sistema actual).

**Restricciones:** Ninguna en MVP. El estado es un campo libre editable.

**Dudas:** ¿Debe haber un flujo de estados con transiciones controladas? ¿Debe un proyecto IN_OPERATION poder volver a OPPORTUNITY? Pendiente de definición de negocio.

---

### 4.2 Contrato (estado legal)

| Estado | Valor | Label | Descripción funcional |
|---|---|---|---|
| Borrador | DRAFT | Borrador | Contrato en proceso de negociación, no firmado |
| Activo | ACTIVE | Activo | Contrato vigente y firmado |
| Expirado | EXPIRED | Expirado | Contrato vencido |

**Transiciones permitidas:**
- DRAFT → ACTIVE (contrato firmado). ⚠️ Desencadena auto-set de NegotiationStatus = SIGNED (solo desde el panel de parcela).
- DRAFT → EXPIRED (negociación fallida o plazo vencido).
- ACTIVE → EXPIRED (vencimiento del contrato).
- EXPIRED → DRAFT (reinicio de negociación — permitido en el sistema, permite crear nuevo contrato).

**Restricciones:**
- No se puede tener más de un contrato DRAFT o ACTIVE para la misma combinación parcelId + ownerId (solo desde el panel; no validado en el formulario completo de contratos).
- EXPIRED no bloquea la creación de un nuevo contrato.

**Dudas:**
- ¿Se debería poder pasar de ACTIVE de vuelta a DRAFT? (rescisión). No está restringido pero tiene implicaciones jurídicas.
- ¿La fecha de firma (signedAt) debe ser obligatoria al pasar a ACTIVE? No está validado.

---

### 4.3 Negociación (estado operativo por proyecto-parcela)

| Estado | Valor | Label | Color | Descripción funcional |
|---|---|---|---|---|
| Buscando | SEARCHING | Buscando | Gris | Estado inicial; sin contacto con el propietario |
| En negociación | NEGOTIATING | En negociación | Azul | Contacto establecido, negociación en curso |
| Acuerdo verbal | ACCEPTED | Acuerdo verbal | Ámbar | Acuerdo informal alcanzado, pendiente de firma |
| Firmado | SIGNED | Firmado | Verde | Contrato firmado (ACTIVE) |
| No negocia | NOT_NEGOTIATING | No negocia | Rojo | Propietario rechaza negociar |
| Competencia | COMPETITION | Competencia | Púrpura | Otro promotor está negociando con este propietario |
| Duplicado | DUPLICATE | Duplicado | Naranja | La parcela es redundante en el contexto del proyecto |
| Cerrado | TERMINATED | Cerrado | Zinc | Proceso cerrado o abandonado por el promotor |

**Transiciones permitidas:** Cualquier estado → cualquier estado (manual, sin restricciones automáticas salvo la regla D2).

**Regla automática D2:** Cuando un contrato vinculado a la parcela pasa a estado ACTIVE (desde el panel de parcela), el sistema automáticamente cambia `ProjectParcel.negotiationStatus` a SIGNED.

**Restricciones:**
- El auto-set a SIGNED solo ocurre cuando el cambio de estado del contrato se realiza desde el panel de parcela (`updateLinkedContractStatusAction`). No ocurre si el contrato se edita desde el módulo de contratos.

**Dudas:**
- ¿Debería NOT_NEGOTIATING o TERMINATED bloquear alguna acción en el proyecto? No actualmente.
- ¿Debería el estado SIGNED volver a NEGOTIATING si el contrato pasa de ACTIVE a EXPIRED? No está implementado.
- ¿Debería haber un estado "En revisión legal" entre ACCEPTED y SIGNED?

---

### 4.4 Parcela

**La parcela no tiene estados propios.** Es una entidad de datos.

**Estados derivados:**
- Con/sin geometría (afecta a la detección automática y al mapa).
- Con/sin contratos (determina el color en el mapa: verde/naranja).
- Asignada/no asignada a un proyecto (determinada por la existencia de `ProjectParcel`).

---

### 4.5 Relación Proyecto-Parcela (ProjectParcel)

**Campos de estado:**
- `affectation`: tipo de afección de la parcela en el proyecto (Planta, Aerogenerador, etc.). Opcional.
- `negotiationStatus`: estado de negociación (ver 4.3).
- `notes`: notas de contratación específicas del proyecto.

**Estado inicial:**
- `negotiationStatus = SEARCHING` (por defecto al asignar una parcela).
- `affectation = null`.
- `notes = null`.

---

### 4.6 Tecnología del proyecto

**No tiene estados.** Es un array embebido en `Project.technologies` como campo JSON. No hay tabla propia.

**Limitaciones:**
- No se puede hacer búsqueda o filtrado por tecnología en el listado de proyectos.
- La potencia total del proyecto (`powerMW`) se recalcula al editar el proyecto.

---

### 4.7 Personas relacionadas (ParcelContact)

**No tiene estados.** Es un catálogo de contactos vinculados a una parcela.

**Particularidad:** Los contactos son globales de la parcela y se muestran en todos los proyectos donde aparezca esa parcela.

---

### 4.8 Permitting

**Estado:** Placeholder sin implementación.

**Descripción:** Tab visible en el detalle del proyecto con mensaje "Disponible en una próxima fase". No existe ningún modelo de datos, acción ni componente funcional de permitting.

---

## 5. Matriz de acciones por pantalla

---

### /login

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Formulario email/password | Enviar credenciales | Crea sesión JWT | User en BD | Error genérico sin distinción de causa |
| Enlace "Regístrate" | Navegar a /register | — | — | — |

---

### /register

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Formulario registro | Crear org + usuario | Organization, User | Ninguna | Email duplicado sin verificación previa |

---

### /dashboard

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Tarjetas métricas | Navegar a módulo | — | getOrganization | Solo lectura |
| Sidebar | Navegar a módulo | — | — | — |

---

### /projects

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Tabla de proyectos | Ver proyectos / navegar a detalle | — | getProjects | — |
| Botón + Nuevo proyecto | Navegar a /projects/new | — | — | — |

---

### /projects/new y /projects/[id]/edit

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Formulario completo | Crear / actualizar proyecto | Project | — | powerMW se recalcula siempre |
| + Añadir tecnología | Añadir fila en formulario | — (UI) | — | — |
| Eliminar tecnología | Quitar fila | — (UI) | — | Si solo hay 1, el formulario no permite enviar |

---

### /projects/[id]

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Botón Editar | Navegar a /projects/[id]/edit | — | — | — |
| Botón Eliminar | Eliminar proyecto | Project, ProjectParcel | Confirmación | Irreversible; cascada a ProjectParcel |
| Botón KML | Descargar KML | — | Geometría del proyecto | Sin geometría, KML vacío |
| Botón Detectar parcelas | Asignar parcelas por intersección | ProjectParcel[] | Geometría del proyecto + parcelas | Sin confirmación previa; sin deshacer |
| Botón + Añadir parcelas | Navegar a /projects/[id]/parcels | — | — | — |
| AffectationSelect (por fila) | Cambiar afección inline | ProjectParcel.affectation | ProjectParcel | Guardado inmediato sin confirmación |
| Chevron de expansión | Expandir/colapsar panel | — (UI) | — | — |
| Enlace parcela (ref catastral) | Navegar a /parcels/[id] | — | — | — |
| Enlace propietario | Navegar a /owners/[id]/edit | — | — | — |

---

### Panel de parcela (ParcelPanel)

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Selector NegotiationStatus | Cambiar estado + Guardar | ProjectParcel.negotiationStatus | — | Sin confirmación |
| Textarea notas | Editar notas + Guardar | ProjectParcel.notes | — | — |
| Crear contrato borrador | Crear contrato DRAFT | Contract | Owner, Parcel | Duplicados bloqueados si DRAFT/ACTIVE existe |
| Selector estado contrato | Cambiar estado legal | Contract.status | Contract | Si → ACTIVE: auto-set SIGNED en negociación |
| Enlace "Ver →" contrato | Navegar a /contracts/[id] | — | — | — |
| "+ Añadir contrato" | Crear contrato adicional | Contract | Owner, Parcel | Misma validación de duplicados |
| "Ver contratos expirados" | Toggle UI | — | — | — |
| + Añadir contacto | Crear contacto parcela | ParcelContact | Parcel | Contacto es global de parcela |
| Eliminar contacto | Borrar contacto | ParcelContact | — | Irreversible |

---

### /projects/[id]/parcels

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Campo de búsqueda | Filtrar parcelas disponibles | — | searchAvailableParcels | Max 30 resultados |
| Botón Asignar | Asignar parcela | ProjectParcel | Project, Parcel | — |
| Botón Desasignar | Desasignar parcela | ProjectParcel | — | Los contratos de la parcela no se eliminan |

---

### /parcels

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| + Nueva parcela | Navegar a /parcels/new | — | — | — |
| Importar CSV | Navegar a /parcels/import | — | — | — |
| Editar (por fila) | Navegar a /parcels/[id]/edit | — | — | — |
| Eliminar (por fila) | Eliminar parcela | Parcel, ProjectParcel, Contract, ParcelContact | Confirmación | Cascada total: elimina contratos y contactos |

---

### /parcels/import

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Input fichero + Analizar | Analizar CSV | — (análisis en memoria) | — | Límite 900KB / 2000 filas |
| Confirmar importación | Insertar parcelas | Parcel[] | — | No se pueden deshacer las inserciones |

---

### /owners

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| + Nuevo propietario | Navegar a /owners/new | — | — | — |
| Editar (por fila) | Navegar a /owners/[id]/edit | — | — | — |
| Eliminar (por fila) | Eliminar propietario | Owner, Contract[] | Confirmación | Elimina todos sus contratos en cascada |

---

### /contracts

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Filtro Tipo | Filtrar tabla | — (URL params) | — | — |
| Filtro Estado | Filtrar tabla | — (URL params) | — | — |
| + Nuevo contrato | Navegar a /contracts/new | — | — | — |
| Clic en fila | Navegar a /contracts/[id] | — | — | — |

---

### /contracts/new y /contracts/[id]/edit

| Elemento | Acción | Datos modificados | Dependencias | Riesgo |
|---|---|---|---|---|
| Formulario contrato | Crear / actualizar contrato | Contract | Parcel, Owner | Sin validación de duplicados; sin auto-set negociación |

---

## 6. Validaciones funcionales esperadas

---

### 6.1 Proyecto

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Nombre obligatorio (mín. 1, máx. 200 chars) | Formulario creación/edición | ✅ Sí | No se puede crear proyecto sin nombre |
| Mínimo 1 tecnología | Formulario creación/edición | ✅ Sí | Proyectos sin tipo de instalación |
| Tipo de tecnología no vacío | Formulario creación/edición | ✅ Sí | Tecnología vacía en el array |
| powerMW calculado como suma automática | Acción crear/editar | ✅ Sí | Inconsistencia entre potencia parcial y total |
| Estado debe ser uno de los 5 valores del enum | Formulario | ✅ Sí | Error de BD |
| Geometría: Polygon o MultiPolygon válido | Editor de geometría | ✅ Sí | Error al intentar guardar GeoJSON inválido |
| Proyecto pertenece a la org del usuario | Servicio | ✅ Sí | Acceso no autorizado a datos de otra org |

---

### 6.2 Parcela

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Referencia catastral obligatoria (máx. 50) | Formulario + CSV | ✅ Sí | Error de inserción |
| Referencia catastral única por organización | BD + servicio | ✅ Sí | Duplicados silenciosos en BD |
| Superficie obligatoria y positiva | Formulario + CSV | ✅ Sí | Error de validación |
| GeoJSON de geometría válido si se proporciona | Formulario + CSV | ✅ Sí | Geometría inválida en BD |
| CSV: máx. 900KB | Importación | ✅ Sí | Ficheros grandes bloquean el servidor |
| CSV: máx. 2000 filas | Importación | ✅ Sí | Idem |
| Duplicados dentro del CSV | Importación | ✅ Sí | Inserciones duplicadas en una misma importación |
| Parcela pertenece a la org | Servicio | ✅ Sí | Acceso no autorizado |
| **Municipio en formulario manual** | Formulario creación | ❌ No hay campo | Municipio solo se puede cargar vía CSV |

---

### 6.3 Propietario

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Nombre obligatorio (máx. 200) | Formulario | ✅ Sí | Error de validación |
| NIF obligatorio (máx. 20, formato libre) | Formulario | ⚠️ Parcial | NIF inválidos pasan la validación |
| NIF único por organización | — | ❌ No | Propietarios duplicados con el mismo NIF |
| Email: formato válido si se proporciona | Formulario | ✅ Sí | Email inválido almacenado en BD |
| Propietario pertenece a la org | Servicio | ✅ Sí | Acceso no autorizado |

---

### 6.4 Contrato

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Tipo obligatorio (RENTAL / PURCHASE) | Formulario | ✅ Sí | Error de validación |
| Estado obligatorio (DRAFT / ACTIVE / EXPIRED) | Formulario | ✅ Sí | Error de validación |
| Precio ≥ 0 si se proporciona | Formulario | ✅ Sí | Error de validación |
| Fecha firma válida si se proporciona | Formulario | ✅ Sí | Error de validación |
| Parcela y propietario de la org | Servicio | ✅ Sí | Acceso no autorizado |
| No duplicar DRAFT/ACTIVE para mismo parcelId+ownerId | Panel de parcela | ✅ Sí (panel) | Contratos duplicados desde formulario global |
| No duplicar DRAFT/ACTIVE para mismo parcelId+ownerId | Formulario global de contratos | ❌ No | Contratos duplicados posibles |
| Fecha de firma obligatoria si estado = ACTIVE | — | ❌ No | Contratos "activos" sin fecha de firma |
| NegotiationStatus = SIGNED al pasar contrato a ACTIVE | Panel de parcela | ✅ Sí | Badge desactualizado si se edita desde módulo de contratos |

---

### 6.5 Negociación (NegotiationStatus)

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Estado debe ser uno de los 8 valores | Acción | ✅ Sí | Error silencioso (acción retorna sin hacer nada) |
| Auto-set SIGNED al activar contrato desde panel | Acción updateLinkedContractStatus | ✅ Sí | Badge incorrecto |
| Auto-set SIGNED al activar contrato desde formulario global | Acción updateContractAction | ❌ No | Inconsistencia de estado |

---

### 6.6 Relación proyecto-parcela

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Una parcela no puede asignarse dos veces al mismo proyecto | BD (@@unique) | ✅ Sí | Error de BD |
| Parcela y proyecto de la misma org | Servicio | ✅ Sí | Asignación entre orgs |
| Afección debe ser una de las opciones predefinidas | — | ⚠️ Solo UI | Valores libres si se manipula la petición |

---

### 6.7 Búsqueda

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Solo devuelve proyectos de la org del usuario | API /search | ✅ Sí | Fuga de datos entre organizaciones |

---

### 6.8 Exportación KML

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Solo exporta proyectos de la org | API /export/kml | ✅ Sí | Fuga de datos |
| Geometría válida antes de incluir en KML | Generador | ✅ Sí (inferido) | KML malformado |

---

### 6.9 Formularios generales

| Validación | Dónde aplica | Implementada | Impacto si falta |
|---|---|---|---|
| Campos requeridos con mensaje de error inline | Todos los formularios | ✅ Sí | Usuario no sabe qué falta |
| Confirmación antes de eliminar entidades | DeleteButtons | ✅ Sí | Eliminaciones accidentales |
| Redirección a /login si sesión expirada | Middleware | ✅ Sí | Acceso a rutas protegidas sin autenticar |

---

## 7. Huecos funcionales, contradicciones y pendientes

---

### 7.1 Inconsistencias entre flujos

**HF-01 — Sincronización del NegotiationStatus al editar contratos desde el módulo de contratos**
- **Problema:** Cuando un usuario cambia el estado de un contrato a ACTIVE desde `/contracts/[id]/edit`, el `NegotiationStatus` del `ProjectParcel` correspondiente NO se actualiza automáticamente a SIGNED. Solo ocurre si el cambio se hace desde el panel de parcela.
- **Impacto:** El badge de estado en la tabla de parcelas puede mostrar "En negociación" aunque el contrato esté ACTIVE.
- **Decisión pendiente:** ¿Se debe sincronizar también desde el módulo de contratos? Implica conocer el projectId en la acción de contratos, lo que no es natural (un contrato puede estar en varios proyectos a través de la parcela).
- **Recomendación:** Considerar sincronizar para todos los proyectos que tengan esa parcela asignada, o mostrar aviso en la edición de contratos.

**HF-02 — Color del mapa vs. NegotiationStatus**
- **Problema:** El mapa del proyecto colorea las parcelas según si tienen contrato (verde) o no (naranja). Sin embargo, el "Estado de Contratación" en la tabla usa `NegotiationStatus`. Una parcela puede estar en estado SIGNED (verde en tabla) pero el mapa la mostrará en naranja si el contrato ha expirado.
- **Decisión pendiente:** ¿Debe el mapa reflejar el NegotiationStatus o la existencia de contrato activo?

**HF-03 — Duplicados de contratos en el formulario global**
- **Problema:** El formulario `/contracts/new` no tiene la validación de duplicados que sí tiene el panel de parcela. Se puede crear un segundo contrato DRAFT para la misma combinación parcelId + ownerId.
- **Impacto:** Datos inconsistentes; contratos duplicados.
- **Decisión pendiente:** Añadir la misma validación en el formulario global.

---

### 7.2 Reglas de negocio no definidas

**HF-04 — ¿Qué ocurre con los contratos al eliminar una parcela?**
- Al eliminar una parcela, sus contratos se eliminan en cascada (por `onDelete: Cascade` en el esquema). Esto incluye contratos ACTIVE. Sin aviso explícito al usuario.
- **Riesgo:** Pérdida irreversible de contratos activos.

**HF-05 — ¿Qué ocurre con los contratos al eliminar un proyecto?**
- Al eliminar un proyecto, se eliminan las `ProjectParcel`. Los contratos (vinculados a la `Parcel`, no a la `ProjectParcel`) **no** se eliminan. Esto es correcto conceptualmente, pero puede dejar contratos sin contexto de proyecto visible.

**HF-06 — ¿Puede un contrato ACTIVE pasar a DRAFT?**
- Técnicamente el sistema lo permite (sin restricción). Funcionalmente, ¿tiene sentido una "rescisión"? No está modelada.

**HF-07 — ¿Qué pasa con el NegotiationStatus si el contrato ACTIVE pasa a EXPIRED?**
- El sistema no actualiza automáticamente el NegotiationStatus cuando un contrato expira. Una parcela puede quedar en estado SIGNED aunque el contrato haya expirado.
- **Decisión pendiente:** ¿Debe EXPIRED → NegotiationStatus volver a NEGOTIATING o a algún estado específico?

**HF-08 — Fecha de firma al pasar contrato a ACTIVE**
- No hay validación que obligue a introducir `signedAt` cuando el estado es ACTIVE. Contratos activos sin fecha de firma son jurídicamente dudosos.

**HF-09 — Precio obligatorio o recomendado en contratos**
- No hay validación de que el precio sea obligatorio. ¿Puede haber contratos sin precio? ¿Hay tipos de contrato (cesión de uso) donde el precio es 0 o no aplica?

**HF-10 — NIF único de propietario**
- No hay validación de unicidad del NIF. Pueden existir dos propietarios con el mismo NIF en la misma organización, lo que genera duplicados problemáticos en la gestión contractual.

---

### 7.3 Entidades insuficientemente modeladas

**HF-11 — Tecnología como JSON embebido**
- `Project.technologies` es un array JSON sin tabla propia. No se puede filtrar o buscar proyectos por tipo de tecnología en el listado. No hay validación de coherencia entre el tipo de tecnología y la potencia MW.

**HF-12 — Municipio no editable en el formulario manual de parcela**
- El campo `municipality` de `Parcel` existe en el modelo pero no aparece en el formulario manual de creación/edición. Solo se puede poblar mediante importación CSV. Hay parcelas sin municipio en el sistema.

**HF-13 — Sin ficha de propietario**
- No existe una pantalla de detalle para el propietario (solo edición). No se pueden ver todos los contratos de un propietario en una sola vista.

**HF-14 — Personas relacionadas sin rol de proyecto**
- Los `ParcelContact` son globales de la parcela. Si la parcela está en 5 proyectos, los mismos contactos aparecen en todos. No se puede tener contactos específicos por proyecto para la misma parcela.

**HF-15 — Sin paginación en ningún listado**
- Todos los listados (proyectos, parcelas, propietarios, contratos) cargan todos los registros sin paginación. Con volúmenes altos de datos, esto degradará el rendimiento.

**HF-16 — Sin búsqueda en los listados de parcelas, propietarios y contratos**
- Solo existe búsqueda global de proyectos. El resto de listados no tienen campo de búsqueda.

---

### 7.4 Decisiones que hay que cerrar

**HF-17 — Roles de usuario**
- Actualmente todos los usuarios tienen acceso completo (CRUD sobre todo). No hay roles (ADMIN, VIEWER, GESTOR). La página de Settings lista los miembros pero sin gestión de roles.

**HF-18 — Invitación de usuarios a la organización**
- Solo existe el registro individual. No hay forma de invitar a un segundo usuario a una organización existente.

**HF-19 — Recuperación de contraseña**
- No existe flujo de "olvidé mi contraseña".

**HF-20 — Permitting: definición funcional**
- La tab "Permitting" en el detalle del proyecto es un placeholder. No hay definición funcional de qué entidades, flujos y estados tendrá.

**HF-21 — Flujo de estados del proyecto**
- ¿Debe haber restricciones en las transiciones de estado del proyecto? ¿Un proyecto IN_OPERATION puede volver a OPPORTUNITY?

**HF-22 — Detección espacial sin confirmación**
- La detección automática de parcelas no pide confirmación antes de crear relaciones. Si la geometría del proyecto está mal definida, puede asignar centenares de parcelas incorrectas.

**HF-23 — ¿Una parcela puede tener contratos con múltiples propietarios simultáneamente?**
- El sistema permite crear contratos con propietarios distintos para la misma parcela (siempre que no sean el mismo propietario). ¿Es esto un caso de uso válido (multipropiedad)?

**HF-24 — ¿El estado de negociación debe revertirse automáticamente en algún caso?**
- Si ACTIVE → EXPIRED, ¿el NegotiationStatus pasa de SIGNED a otro estado? No está definido.

---

## 8. Priorización funcional recomendada

---

### 8.1 Flujos críticos — revisar primero

Estos flujos son el núcleo del valor de la aplicación. Cualquier error aquí impacta directamente en la operación diaria:

| Prioridad | Flujo | Motivo |
|---|---|---|
| 🔴 P0 | Panel de parcela → Estado de negociación | Es el corazón de la gestión de terrenos |
| 🔴 P0 | Panel de parcela → Crear contrato borrador | Permite avanzar en la negociación |
| 🔴 P0 | Panel de parcela → Cambiar estado del contrato | Cierre de negociación |
| 🔴 P0 | Auto-set SIGNED al activar contrato | Sincronización crítica de estados |
| 🔴 P0 | Validación de duplicados en contratos (panel) | Integridad de datos |

---

### 8.2 Flujos de alto riesgo — validar urgentemente

| Prioridad | Flujo | Riesgo identificado |
|---|---|---|
| 🟠 P1 | Edición de contrato desde módulo de contratos → sin auto-set SIGNED | HF-01: Inconsistencia de estado |
| 🟠 P1 | Eliminación de propietario → cascada contratos | HF-04: Pérdida de contratos ACTIVE |
| 🟠 P1 | Detección automática de parcelas → sin confirmación | HF-22: Asignaciones masivas incorrectas |
| 🟠 P1 | Creación de contrato desde formulario global → sin validación de duplicados | HF-03: Contratos duplicados |
| 🟠 P1 | NIF de propietario sin validación de unicidad | HF-10: Propietarios duplicados |

---

### 8.3 Flujos importantes — revisar en segunda iteración

| Prioridad | Flujo | Motivo |
|---|---|---|
| 🟡 P2 | Importación CSV de parcelas | Flujo crítico para la carga inicial de datos |
| 🟡 P2 | Detalle de parcela → proyectos y contratos asociados | Vista completa del estado de una parcela |
| 🟡 P2 | Listado de contratos con filtros | Monitorización global de contratos |
| 🟡 P2 | Exportación KML | Herramienta GIS de trabajo habitual |
| 🟡 P2 | Búsqueda global de proyectos | UX de navegación rápida |

---

### 8.4 Flujos que pueden esperar

| Prioridad | Flujo | Motivo |
|---|---|---|
| 🟢 P3 | Configuración de organización | Funcionalidad básica, MVP suficiente |
| 🟢 P3 | Permitting | Placeholder sin funcionalidad |
| 🟢 P3 | Paginación y búsqueda en listados | Rendimiento; aceptable en volúmenes actuales |
| 🟢 P3 | Roles y permisos | No urgente si todos los usuarios son de confianza |
| 🟢 P3 | Recuperación de contraseña | Crítico a largo plazo, aceptable en MVP |
| 🟢 P3 | Ficha de propietario con historial de contratos | Mejora de UX, no bloquea ningún flujo |

---

### 8.5 Decisiones de negocio pendientes de cierre

Antes de avanzar en el desarrollo, se recomienda cerrar las siguientes decisiones con el equipo de negocio:

1. **HF-01:** ¿Sincronizar NegotiationStatus desde el módulo de contratos? (Requiere cambio en acciones de contrato).
2. **HF-07:** ¿Qué ocurre con el NegotiationStatus cuando un contrato pasa a EXPIRED?
3. **HF-08:** ¿Es obligatoria la fecha de firma al pasar un contrato a ACTIVE?
4. **HF-10:** ¿Debe el NIF del propietario ser único por organización?
5. **HF-14:** ¿Los contactos de parcela deben ser globales o por proyecto?
6. **HF-20:** Definición funcional completa de Permitting.
7. **HF-21:** ¿Hay restricciones en las transiciones de estado del proyecto?
8. **HF-22:** ¿Añadir confirmación a la detección automática de parcelas?
9. **HF-23:** ¿Está permitida la multipropiedad (contratos con distintos propietarios para la misma parcela simultáneamente)?

---

*Fin de la especificación funcional v1.0 — StarLand*
