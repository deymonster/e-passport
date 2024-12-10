/*
  Warnings:

  - Added the required column `url` to the `registry_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "registry_records" ADD COLUMN     "url" TEXT NOT NULL;
