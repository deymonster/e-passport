/*
  Warnings:

  - You are about to drop the column `pcId` on the `tickets` table. All the data in the column will be lost.
  - You are about to drop the `pc` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[passportId,status]` on the table `tickets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `passportId` to the `tickets` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('ARM', 'PC');

-- CreateEnum
CREATE TYPE "WarrantyPeriod" AS ENUM ('MONTHS_12', 'MONTHS_24', 'MONTHS_36');

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_pcId_fkey";

-- DropIndex
DROP INDEX "tickets_pcId_status_key";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "batchId" INTEGER,
ADD COLUMN     "passportId" INTEGER;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "pcId",
ADD COLUMN     "passportId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "pc";

-- CreateTable
CREATE TABLE "batches" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "registryRecordId" INTEGER,
    "warrantyPeriod" "WarrantyPeriod" NOT NULL,
    "type" "DeviceType" NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passport" (
    "id" SERIAL NOT NULL,
    "sn" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "name" TEXT,
    "registryRecordId" INTEGER,
    "type" "DeviceType" NOT NULL DEFAULT 'PC',
    "productionDate" TIMESTAMP(3) NOT NULL,
    "warrantyPeriod" "WarrantyPeriod" NOT NULL DEFAULT 'MONTHS_12',
    "batchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batches_orderNumber_key" ON "batches"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "passport_sn_key" ON "passport"("sn");

-- CreateIndex
CREATE UNIQUE INDEX "passport_orderNumber_key" ON "passport"("orderNumber");

-- CreateIndex
CREATE INDEX "logs_date_idx" ON "logs"("date");

-- CreateIndex
CREATE INDEX "tickets_passportId_idx" ON "tickets"("passportId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_passportId_status_key" ON "tickets"("passportId", "status");

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_registryRecordId_fkey" FOREIGN KEY ("registryRecordId") REFERENCES "registry_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport" ADD CONSTRAINT "passport_registryRecordId_fkey" FOREIGN KEY ("registryRecordId") REFERENCES "registry_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport" ADD CONSTRAINT "passport_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "passport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "passport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
