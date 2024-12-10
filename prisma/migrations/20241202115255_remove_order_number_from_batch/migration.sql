/*
  Warnings:

  - You are about to drop the column `orderNumber` on the `batches` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "batches_orderNumber_key";

-- AlterTable
ALTER TABLE "batches" DROP COLUMN "orderNumber";
