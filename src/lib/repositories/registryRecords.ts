import { BaseRepository } from './BaseRepository';
import { PrismaClient, Prisma } from '@prisma/client';

export class RegistryRecordRepository extends BaseRepository<
  Prisma.RegistryRecordCreateInput,
  Prisma.RegistryRecordDelegate<any>,
  Prisma.RegistryRecordFindManyArgs
> {
  constructor(prisma: PrismaClient) {
    super(prisma, (client) => client.registryRecord);
  }
}
