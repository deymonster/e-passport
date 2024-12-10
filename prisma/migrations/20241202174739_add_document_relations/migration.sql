/*
  Warnings:

  - You are about to drop the column `batchId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `passportId` on the `documents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[filePath]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('USER_MANUAL', 'PRODUCT_IMAGE', 'TECHNICAL_SPEC', 'OTHER');

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_batchId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_passportId_fkey";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "batchId",
DROP COLUMN "passportId",
ADD COLUMN     "type" "DocumentType" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "batch_documents" (
    "batchId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_documents_pkey" PRIMARY KEY ("batchId","documentId")
);

-- CreateTable
CREATE TABLE "passport_documents" (
    "passportId" INTEGER NOT NULL,
    "documentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passport_documents_pkey" PRIMARY KEY ("passportId","documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_filePath_key" ON "documents"("filePath");

-- AddForeignKey
ALTER TABLE "batch_documents" ADD CONSTRAINT "batch_documents_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_documents" ADD CONSTRAINT "batch_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_documents" ADD CONSTRAINT "passport_documents_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "passport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_documents" ADD CONSTRAINT "passport_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
