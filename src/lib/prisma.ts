import { PrismaClient } from '@prisma/client';

declare global {
  var prismaClientInstance: PrismaClient | undefined;
}

const prisma = globalThis.prismaClientInstance || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaClientInstance = prisma;
}

export { prisma };
  
