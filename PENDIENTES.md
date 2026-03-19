# Pendientes de refinamiento — StarLand

Documento vivo. Cada ítem se elimina cuando el prompt correspondiente lo resuelve.

---

## Modelo de datos

- [ ] **`connectionPoints` como tabla FK (`ConnectionPoint`)**
  Actualmente `String[]` en `projects`. Migrar cuando haya catálogo oficial de puntos de conexión (nombre, tensión, capacidad disponible, etc.).

- [ ] **`developer` como FK a tabla `Developer`**
  Actualmente `String?` en `projects`. Migrar cuando se necesite ficha de desarrollador (NIF, contacto, proyectos asociados).

- [ ] **`spv` como FK a tabla `Spv`**
  Actualmente `String?` en `projects`. Migrar cuando haya datos propios de la SPV (CIF, socios, banco, etc.).

- [ ] **Migración de proyectos legacy sin `technologies`**
  Los proyectos creados antes de la Fase 2 tienen `technologies = null` y `powerMW = null`.
  Se muestran con `—` en potencia. Acción: editar cada proyecto para rellenar sus tecnologías.

---

## Funcionalidades pendientes

- [ ] **Tab Permitting — contenido real**
  Creado como placeholder en Fase 3. Implementar cuando se definan los expedientes, licencias y permisos administrativos que debe gestionar.

- [ ] **Filtro por tecnología en listado de proyectos**
  El listado actual filtra por texto libre. Añadir filtro por tipo de tecnología (Fotovoltaica, Eólico, etc.) cuando el cliente lo pida.

- [ ] **Paginación en listado de proyectos**
  La tabla actual carga todos los proyectos de la org en cliente. Si la lista supera ~200 proyectos, añadir paginación server-side con `searchParams` en URL.

- [ ] **Paginación en listado de parcelas**
  Mismo problema potencial que proyectos.

- [ ] **Editor de geometría accesible desde detalle**
  Se eliminó el bloque GeoJSON del detalle en Fase 3. El editor sigue en `/edit`. Evaluar si necesita un acceso rápido desde el detalle (botón o modal).

- [ ] **Panel de parcela — mostrar todos los contratos**
  El panel expandible de la tabla de terrenos muestra solo el contrato de mayor prioridad (ACTIVE > DRAFT > EXPIRED). Si una parcela tiene varios contratos históricos, podría interesar listarlos todos en el panel.

---

## Integraciones externas

- [ ] **"Abrir en Google Earth Web" (botón directo)**
  Solo funciona con dominio público. Implementar cuando la app esté en producción con URL fija.

- [ ] **Google Earth / Mapbox en producción**
  El mapa actual usa Leaflet + OpenStreetMap (gratuito). Evaluar si se necesita imagery de satélite (requiere API key de Google Maps o Mapbox).

---

## Build / Infraestructura

- [ ] **Actualizar Prisma de v6 a v7**
  El build avisa de major update disponible (`6.19.2 → 7.5.0`). Revisar breaking changes en https://pris.ly/d/major-version-upgrade antes de actualizar.

---

## Resuelto en Fase 6

- [x] **`municipality` en importación CSV** — campo leído del CSV (columnas: `municipio`, `municipality`, `termino_municipal`, `localidad`) e insertado en BD.
- [x] **Búsqueda de estados por label en tabla de proyectos** — buscar "En Operación" o "Ready to Build" ahora funciona correctamente.
- [x] **Fila desplegable en tabla de parcelas** — implementado en Fase 5. Panel expandible con notas, propietario/contrato y personas relacionadas.
- [x] **React Fragment key** — corregido en `project-tabs.tsx` (map sin key en Fragment causaba warning de React).
- [x] **`STATUS_LABELS` naming collision** — renombrado a `PROJECT_STATUS_LABELS` en `project.ts`; actualizado en todos los consumidores.
