import { prisma } from '@/lib/prisma';
import { BatchRepository } from './batchRepository';
import { PassportRepository } from './passportRepository';
import { DocumentRepository } from './documentRepository';
import { RegistryRecordRepository } from './registryRecords';
import { TicketRepository } from './ticketRepository';
import { MessageRepository } from './messageRepository';



export const repositories = {
  batch: new BatchRepository(prisma),
  passport: new PassportRepository(prisma),
  document: new DocumentRepository(prisma),
  registryRecord: new RegistryRecordRepository(prisma),
  ticket: new TicketRepository(prisma),
  message: new MessageRepository(prisma),
};
