import { BaseRepository } from './BaseRepository';
import { PrismaClient, Prisma } from '@prisma/client';

interface CreatePassportInput {
  sn: string;
  orderNumber: string;
  name: string | null;
  registryRecordId: number | null;
  type: 'ARM' | 'PC';
  productionDate: Date;
  warrantyPeriod: 'MONTHS_12' | 'MONTHS_24' | 'MONTHS_36';
  batchId: number | null;
  documentIds: number[]; // Список ID уже существующих документов
}

interface UpdatePassportInput extends Partial<CreatePassportInput> {
  documentsToAdd?: number[]; // ID документов для добавления
  documentsToRemove?: number[]; // ID документов для удаления
}

interface GetAllOptions {
  offset?: number;
  limit?: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  orderNumber?: string;
}

export class PassportRepository extends BaseRepository<
  Prisma.PassportCreateInput,
  Prisma.PassportDelegate,
  Prisma.PassportFindManyArgs
> {
  constructor(prisma: PrismaClient) {
    super(prisma, (client) => client.passport);
  }

  // Получить все паспорта с фильтрацией и пагинацией
  async getAllwithOptions(options: GetAllOptions) {
    const {
      search = '',
      offset = 0,
      limit = 20,
      dateFrom,
      dateTo,
      orderNumber,
    } = options;

    const where: Prisma.PassportWhereInput = {
      AND: [
        {
          OR: [
            { sn: { contains: search, mode: Prisma.QueryMode.insensitive } }, // Указываем правильный тип
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } }, // Указываем правильный тип
          ],
        },
        ...(dateFrom ? [{ productionDate: { gte: dateFrom } }] : []), // Проверяем корректность типов
        ...(dateTo ? [{ productionDate: { lte: dateTo } }] : []), // Проверяем корректность типов
        ...(orderNumber
          ? [
              {
                orderNumber: {
                  contains: orderNumber,
                  mode: Prisma.QueryMode.insensitive, // Указываем режим для фильтра
                },
              },
            ]
          : []),
      ],
    };

    const [passports, totalCount] = await Promise.all([
      this.prisma.passport.findMany({
        where,
        include: {
          documents: {
            include: {
              document: true,
            },
          },
          batch: true,
          registryRecord: true,
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.passport.count({ where }),
    ]);

    return {
      passports: passports.map(PassportRepository.formatPassportResponse),
      totalCount,
    };
  }

  // Получить паспорт по ерийному номеру и номеру партии
  async getBySerialAndOrder(sn: string, orderNumber: string) {
    return await this.model.findFirst({
      where: {
        sn,
        orderNumber,
      },
      include: {
        documents: {
          include: {
            document: true,
          },
        },

        batch: true,
        registryRecord: true,
      },
    });
  }

  // Получить паспорт с учётом связей
  async getPassportWithRelations(id: number) {
    return await this.model.findUnique({
      where: { id },
      include: {
        documents: {
          include: {
            document: true, // Загружаем данные документа
          },
        },
        batch: true, // Загружаем данные партии
        registryRecord: true, // Загружаем данные записи реестра
      },
    });
  }

  // Создать паспорт с привязкой к уже существующим документам
  async createPassport(data: CreatePassportInput) {
    const { documentIds, ...passportData } = data;

    return await this.model.create({
      data: {
        ...passportData,
        documents: {
          create: documentIds.map((documentId) => ({
            documentId,
          })),
        },
      },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
       
      },
    });
  }

  // Обновить паспорт, добавив или удалив документы
  async updatePassport(id: number, data: any) {
    const updatedPassport = await this.prisma.passport.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        batch: true,
        registryRecord: true,
      },
    });

    return PassportRepository.formatPassportResponse(updatedPassport);
  }

  // Удалить паспорт
  async deletePassport(id: number) {
    const passport = await this.prisma.passport.delete({
      where: { id },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        batch: true,
        registryRecord: true,
      },
    });

    return PassportRepository.formatPassportResponse(passport);
  }

  static formatPassportResponse(passport: Prisma.PassportGetPayload<{ include: { documents: { include: { document: true } } } }> ) {
    return {
      ...passport,
      documents: passport.documents.map((pd) => pd.document),
    };
  }
}
