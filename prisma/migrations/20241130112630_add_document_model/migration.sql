/*
  Warnings:

  - You are about to drop the `RegistryRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "RegistryRecord";

-- CreateTable
CREATE TABLE "registry_records" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registry_records_pkey" PRIMARY KEY ("id")
);
