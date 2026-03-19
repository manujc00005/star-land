-- Migration: project_model_v2
-- Cambia el enum ProjectStatus, añade campos de tecnologías y datos relacionales,
-- y hace powerMW opcional.

-- ── 1. Eliminar el DEFAULT antes de tocar el enum ─────────────────────────────
-- Si no, DROP TYPE falla porque el DEFAULT referencia el tipo viejo.
ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT;

-- ── 2. Renombrar enum viejo ────────────────────────────────────────────────────
ALTER TYPE "project_status" RENAME TO "project_status_old";

-- ── 3. Crear enum nuevo ────────────────────────────────────────────────────────
CREATE TYPE "project_status" AS ENUM (
  'OPPORTUNITY',
  'IN_DEVELOPMENT',
  'RTB',
  'IN_CONSTRUCTION',
  'IN_OPERATION'
);

-- ── 4. Soltar dependencia del enum viejo convirtiendo a TEXT ───────────────────
ALTER TABLE "projects" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

-- ── 5. Eliminar enum viejo (ahora seguro: sin DEFAULT, sin columna tipada) ─────
DROP TYPE "project_status_old";

-- ── 6. Mapear valores antiguos → nuevos ───────────────────────────────────────
UPDATE "projects" SET "status" = 'OPPORTUNITY'      WHERE "status" = 'PLANNING';
UPDATE "projects" SET "status" = 'IN_CONSTRUCTION'  WHERE "status" = 'CONSTRUCTION';
UPDATE "projects" SET "status" = 'IN_OPERATION'     WHERE "status" = 'OPERATIVE';

-- ── 7. Convertir columna al nuevo enum ────────────────────────────────────────
ALTER TABLE "projects"
  ALTER COLUMN "status" TYPE "project_status"
  USING "status"::"project_status";

-- ── 8. Restaurar DEFAULT con el nuevo tipo ────────────────────────────────────
ALTER TABLE "projects"
  ALTER COLUMN "status" SET DEFAULT 'OPPORTUNITY';

-- ── 9. powerMW: hacer opcional ────────────────────────────────────────────────
ALTER TABLE "projects" ALTER COLUMN "powerMW" DROP NOT NULL;

-- ── 10. Nuevas columnas ────────────────────────────────────────────────────────
ALTER TABLE "projects" ADD COLUMN "technologies"      JSONB;
ALTER TABLE "projects" ADD COLUMN "connectionPoints"  TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE "projects" ADD COLUMN "cluster"           TEXT;
ALTER TABLE "projects" ADD COLUMN "developer"         TEXT;
ALTER TABLE "projects" ADD COLUMN "spv"               TEXT;
