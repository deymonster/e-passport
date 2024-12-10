-- DropForeignKey
ALTER TABLE "batch_documents" DROP CONSTRAINT "batch_documents_batchId_fkey";

-- DropForeignKey
ALTER TABLE "batch_documents" DROP CONSTRAINT "batch_documents_documentId_fkey";

-- DropForeignKey
ALTER TABLE "passport_documents" DROP CONSTRAINT "passport_documents_documentId_fkey";

-- DropForeignKey
ALTER TABLE "passport_documents" DROP CONSTRAINT "passport_documents_passportId_fkey";

-- AddForeignKey
ALTER TABLE "batch_documents" ADD CONSTRAINT "batch_documents_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_documents" ADD CONSTRAINT "batch_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_documents" ADD CONSTRAINT "passport_documents_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "passport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passport_documents" ADD CONSTRAINT "passport_documents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
