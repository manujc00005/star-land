-- Migration: parcel_contact_notes
-- Añade notas de contratación a la relación proyecto-parcela.
-- Crea la tabla de contactos de parcela (personas de gestión, no propietarios catastrales).

-- ── 1. Notas en ProjectParcel ─────────────────────────────────────────────────
ALTER TABLE "project_parcels" ADD COLUMN "notes" TEXT;

-- ── 2. Tabla ParcelContact ────────────────────────────────────────────────────
CREATE TABLE "parcel_contacts" (
  "id"             TEXT        NOT NULL,
  "name"           TEXT        NOT NULL,
  "role"           TEXT        NOT NULL,
  "phone"          TEXT,
  "email"          TEXT,
  "notes"          TEXT,
  "parcelId"       TEXT        NOT NULL,
  "organizationId" TEXT        NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "parcel_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parcel_contacts_parcelId_fkey"
    FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE,
  CONSTRAINT "parcel_contacts_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX "parcel_contacts_parcelId_idx"       ON "parcel_contacts"("parcelId");
CREATE INDEX "parcel_contacts_organizationId_idx" ON "parcel_contacts"("organizationId");
