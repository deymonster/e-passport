/*
  Warnings:

  - Added the required column `orderNumber` to the `batches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "orderNumber" TEXT NOT NULL;
