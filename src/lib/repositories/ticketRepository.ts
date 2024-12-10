import { PrismaClient, Prisma, Status } from '@prisma/client'; // Убедитесь, что импортируете Status
import { BaseRepository } from './BaseRepository';

type CreateTicketInput = Prisma.TicketCreateInput;
type FindManyTicketArgs = Prisma.TicketFindManyArgs;

export class TicketRepository extends BaseRepository<
  CreateTicketInput,
  Prisma.TicketDelegate,
  FindManyTicketArgs
> {
  constructor(prisma: PrismaClient) {
    super(prisma, (p) => p.ticket);
  }

  // получение обращений с связанными данными
  async getWithRelations(ticketId: number) {
    return this.model.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { date: 'asc' } },
        passport: true,
      },
    });
  }

  // обновление статуса
  async updateStatus(ticketId: number, status: Status) { // Используем тип Status
    return this.model.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  // получение обращений которые ожидают закрытие от пользователя
  async getAwaitingConfirmation() {
    return this.model.findMany({
      where: {
        AND: [
          { status: 'IN_PROGRESS'},
          { pendingClosure: true },
          { confirmedByUser: false }
        ]
      },
      include: {
        messages: { orderBy: { date: 'asc' } },
        passport: true
      }
    })
  }

  // получение обращений в статусе OPEN and IN_PROGRESS
  async getActiveTickets() {
    return this.model.findMany({
      where: {
        OR: [
          { status: 'OPEN' },
          { status: 'IN_PROGRESS' }
        ]
      },
      include: {
        messages: { orderBy: { date: 'asc' } },
        passport: true
      },
      orderBy: {
        dateCreated: 'desc'
      }
    });
  }

  // получение обращения по passportId со статусом OPEN and IN_PROGRESS
  async getTicketByPassportId(passportId: number, sessionId: string) {
     return this.model.findFirst({
      where: {
        passportId: passportId,
        sessionId: sessionId,
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      }
     })
  }

  // получение обращений со статусом CLOSED
  async getClosedTickets() {
    return this.model.findMany({
      where: { status: 'CLOSED' },
      include: {
        messages: { orderBy: { date: 'asc' } },
        passport: true
      },
      orderBy: {
        dateCreated: 'desc'
      }
    });
  }

  // получение тикетов по passportId для пользователя
  async getTicketsByPassportId(passportId: number) {
    return this.model.findMany({
      where: { passportId },
      include: {
        messages: { orderBy: { date: 'asc' } }
      },
      orderBy: {
        dateCreated: 'desc'
      }

    });
  }

  // запрос на закрытие обращения от админа
  async requestClosure(ticketId: number) {
    return this.model.update({
      where: { id: ticketId },
      data: { 
        pendingClosure: true,
        confirmedByUser: false
      },
    });
  }

  // пользователь подтверждает закрытие обращения
  async confirmClosure(ticketId: number) {
    return this.model.update({
      where: { id: ticketId },
      data: { 
        pendingClosure: false,
        confirmedByUser: true,
        status: 'CLOSED'
      },
    });
  }

  


  
}
