-- Migration: parcel_municipality_affectation
-- Añade campo Municipio a parcelas y campo Afección a la relación proyecto-parcela.

ALTER TABLE "parcels"        ADD COLUMN "municipality" TEXT;
ALTER TABLE "project_parcels" ADD COLUMN "affectation" TEXT;
