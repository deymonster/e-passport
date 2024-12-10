import { BaseRepository } from './BaseRepository';
import { PrismaClient, Prisma } from '@prisma/client';

export class DocumentRepository extends BaseRepository<
  Prisma.DocumentCreateInput,
  Prisma.DocumentDelegate<any>,
  Prisma.DocumentFindManyArgs
> {
  constructor(prisma: PrismaClient) {
    super(prisma, (client) => client.document);
  }

  // Кастомный метод для создания документа
  async createDocument(name: string, filePath: string): Promise<Prisma.DocumentCreateInput> {
    try {
      return await this.model.create({
        data: {
          name,
          filePath,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create document: ${error.message}`);
      }

      throw new Error('Failed to create document: Unknown error occurred');
    }
  }
}


