// import { PrismaClient } from '@prisma/client';

// declare global {
//   var prismaClientInstance: PrismaClient | undefined;
// }

// const prisma = globalThis.prismaClientInstance || new PrismaClient();

// if (process.env.NODE_ENV !== 'production') {
//   globalThis.prismaClientInstance = prisma;
// }

// export { prisma };
  

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

