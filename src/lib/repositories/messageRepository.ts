import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './BaseRepository';

type CreateMessageInput = Prisma.MessageCreateInput;
type FindManyMessageArgs = Prisma.MessageFindManyArgs;

type CreateMessageDto = {
  content: string;
  isAdmin: boolean;
  ticketId: number; 
}

interface GetMessagesOptions {
  page?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

export class MessageRepository extends BaseRepository<
  CreateMessageInput,
  Prisma.MessageDelegate,
  FindManyMessageArgs
> {
  constructor(prisma: PrismaClient) {
    super(prisma, (p) => p.message);
  }

  // Получение сообщений тикета
  async getByTicket(ticketId: number) {
    return this.model.findMany({
      where: { ticketId },
      orderBy: { date: 'asc' },
    });
  }

  //  создание сообщения с DTO
  async createMessage(data: CreateMessageDto) {
    
    return this.create({
      content: data.content,
      isAdmin: data.isAdmin,
      ticket: {
        connect: {
          id: data.ticketId
        }
      }
    });
  }

  // Получение сообщений с пагинацией
  async getMessagesWithPagination(ticketId: number, options: GetMessagesOptions = {}) {
      const {
        page = 1,
        limit = 10,
        orderBy = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        this.model.findMany({
          where: { ticketId },
          orderBy: { date: orderBy },
          skip,
          take: limit,
        }),
        this.model.count({
          where: { ticketId },
        })
      ]);

      return {
        messages,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          perPage: limit
        }

      };
  }

  // Получение последних сообщений для нескольких тикетов
  async getLatestMessages(ticketIds: number[], limit: number = 1) {
    const messages = await this.model.findMany({
      where: {
        ticketId: {
          in: ticketIds
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
    });

    //Группируем сообщения по тикетам
    const messagesByTicket = messages.reduce((acc, message) => {
      if (!acc[message.ticketId]) {
        acc[message.ticketId] = [];
      }
      acc[message.ticketId].push(message);
      return acc;
    }, {} as Record<number, typeof messages>);

    return messagesByTicket;
  }

  // Получение количества сообщений для тикета
  async getMessagesCount(ticketId: number) {
    return this.model.count({
      where: { ticketId }
    });
  }
  
}
