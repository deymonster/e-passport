import { PrismaClient, Prisma } from '@prisma/client';

export abstract class BaseRepository<
  TCreateInput,
  TDelegate extends { findMany: Function; findUnique: Function; create: Function; update: Function; delete: Function },
  TFindManyArgs
> {
  protected model: TDelegate;

  constructor(protected prisma: PrismaClient, getModel: (prisma: PrismaClient) => TDelegate) {
    this.model = getModel(prisma);
  }

  async getAll(params?: TFindManyArgs) {
    return await this.model.findMany(params as any);
  }

  async getById(id: number, include?: Record<string, any>) {
    return await this.model.findUnique({
      where: { id },
      include,
    } as any);
  }

  async create(data: TCreateInput) {
    return await this.model.create({ data } as any);
  }

  async update(id: number, data: Partial<TCreateInput>) {
    return await this.model.update({
      where: { id },
      data,
    } as any);
  }

  async delete(id: number) {
    return await this.model.delete({
      where: { id },
    } as any);
  }
}
