-- CreateEnum
CREATE TYPE "negotiation_status" AS ENUM ('SEARCHING', 'NEGOTIATING', 'ACCEPTED', 'SIGNED', 'NOT_NEGOTIATING', 'COMPETITION', 'DUPLICATE', 'TERMINATED');

-- AlterTable
ALTER TABLE "project_parcels" ADD COLUMN "negotiationStatus" "negotiation_status" NOT NULL DEFAULT 'SEARCHING';
