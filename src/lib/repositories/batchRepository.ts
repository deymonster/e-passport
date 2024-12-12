import { BaseRepository } from './BaseRepository';
import { PassportRepository } from './passportRepository';
import { PrismaClient, Prisma } from '@prisma/client';


interface CreateBatchInput {
  orderNumber: string;
  registryRecordId: number | null;
  warrantyPeriod: 'MONTHS_12' | 'MONTHS_24' | 'MONTHS_36';
  type: 'ARM' | 'PC';
  productionDate: Date;
  documentIds: number[]; // Список ID документов для BatchDocuments
  numberOfPassports: number; // Количество паспортов
  passportName: string;
  
}

type BatchWithRelations = Prisma.BatchGetPayload<{
  include: {
    passports: true; // Загрузка связанных паспортов
    documents: {
      include: {
        document: true; // Загрузка документов
      };
    };
    registryRecord: true; // Загрузка записи реестра
  };
}>;

export class BatchRepository extends BaseRepository<
  Prisma.BatchCreateInput,
  Prisma.BatchDelegate<any>,
  Prisma.BatchFindManyArgs
> {
  private passportRepository: PassportRepository;

  constructor(prisma: PrismaClient) {
    super(prisma, (client) => client.batch);
    this.passportRepository = new PassportRepository(prisma);
  }

  // Генерация серийного номера
  private generateSerialNumber(
    year: string,
    month: string,
    type: string,
    orderNumber: string,
    position: number
  ): string {
    const paddedOrderNumber = orderNumber.padStart(8, '0');
    const paddedPosition = position.toString().padStart(6, '0');
    return `НО${year}${month}${type}${paddedOrderNumber}${paddedPosition}`;
  }

  // Получение всех записей типизированных
  async getAll(): Promise<BatchWithRelations[]> {
    return await this.model.findMany({
      include: {
        passports: true,
        documents: {
          include: {
            document: true,
          },
        },
        registryRecord: true,
      },
    });
  }

  // Создать партию с паспортами и документами
  async createBatch(data: CreateBatchInput): Promise<BatchWithRelations | null> {
    const { documentIds, numberOfPassports, passportName, ...batchData } = data;

    // Создать партию
    const batch = await this.model.create({
      data: {
        ...batchData,
        documents: {
          create: documentIds.map((documentId) => ({
            documentId,
          })),
        },
      },
      include: {
        documents: true,
      },
    });

    // Генерация серийных номеров и создание паспортов
    const year = batchData.productionDate.getFullYear().toString().slice(-2);
    const month = (batchData.productionDate.getMonth() + 1).toString().padStart(2, '0');
    const typeCode = batchData.type === 'ARM' ? '1' : '2';

    for (let i = 0; i < numberOfPassports; i++) {
      const serialNumber = this.generateSerialNumber(
        year,
        month,
        typeCode,
        batchData.orderNumber,
        i + 1
      );

      // Создать паспорт
      await this.passportRepository.createPassport({
        sn: serialNumber,
        orderNumber: batchData.orderNumber,
        name: passportName,
        registryRecordId: batchData.registryRecordId,
        type: batchData.type,
        productionDate: batchData.productionDate,
        warrantyPeriod: batchData.warrantyPeriod,
        batchId: batch.id,
        documentIds: documentIds, // Используем те же документы для паспортов
      });
    }

    

    // Возвращаем обновлённую партию с привязанными паспортами
    return await this.model.findUnique({
      where: { id: batch.id },
      include: {
        passports: true,
        documents: {
          include: {
            document: true,
          },
        },
        registryRecord: true,
      },
    });
  }

  // Получние партии со связанными документами и данными
  async getBatchWithRelations(id: number): Promise<BatchWithRelations | null> {
    return await this.model.findUnique({
      where: { id },
      include: {
        documents: {
          include: {
            document: true, // Загружаем данные документов
          },
        },
        passports: {
          include: {
            documents: {
              include: {
                document: true, // Загружаем данные документов паспорта
              },
            },
          },
        },
        registryRecord: true,
      },
    });
  }

  //удаление партии
  async deleteBatch(id: number): Promise<void> {
    // Удаляем связи с документами в BatchDocuments
    await this.prisma.batchDocument.deleteMany({
      where: { batchId: id },
    });

    // Удаляем паспорта, связанные с партией
    await this.prisma.passport.deleteMany({
      where: { batchId: id },
    });

    // Удаляем саму партию
    await this.model.delete({
      where: { id },
    });
  }
}

