-- AlterEnum
ALTER TYPE "contract_status" ADD VALUE 'SIGNED_ADDENDUM';

-- DropForeignKey
ALTER TABLE "parcel_contacts" DROP CONSTRAINT "parcel_contacts_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "parcel_contacts" DROP CONSTRAINT "parcel_contacts_parcelId_fkey";

-- DropIndex
DROP INDEX "parcel_contacts_organizationId_idx";

-- DropIndex
DROP INDEX "parcel_contacts_parcelId_idx";

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "nextStep" TEXT,
ADD COLUMN     "nextStepDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "parcel_contacts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "connectionPoints" DROP DEFAULT;

-- CreateTable
CREATE TABLE "contract_parcels" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_parcels_contractId_parcelId_key" ON "contract_parcels"("contractId", "parcelId");

-- AddForeignKey
ALTER TABLE "contract_parcels" ADD CONSTRAINT "contract_parcels_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_parcels" ADD CONSTRAINT "contract_parcels_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_parcels" ADD CONSTRAINT "contract_parcels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_contacts" ADD CONSTRAINT "parcel_contacts_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_contacts" ADD CONSTRAINT "parcel_contacts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
