import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

import { TicketRepository } from '@/lib/repositories/ticketRepository';
import { MessageRepository } from '@/lib/repositories/messageRepository';
import { PassportRepository } from '@/lib/repositories/passportRepository';

import { withAdminAuth } from '@/lib/auth';

const ticketRepository = new TicketRepository(prisma);
const messageRepository = new MessageRepository(prisma);
const passportRepository = new PassportRepository(prisma);

// получение обращений с фильтрацией по типу обращения
export const GET = withAdminAuth(async (req: NextRequest) =>{
  try {

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'all' | 'active' | 'awaiting' | 'closed'
    let tickets;

    switch (filter) {
      case 'active':
        tickets = await ticketRepository.getActiveTickets();
        break;
      case 'awaiting':
        tickets = await ticketRepository.getAwaitingConfirmation();
        break;
      case 'closed':
        tickets = await ticketRepository.getClosedTickets();
        break;
      default:
        // получаем все тикеты
        tickets = await ticketRepository.getAll({
          include: {
            messages: {
              orderBy: {
                date: 'asc',
               },
              },
              passport: true
          },
          orderBy: {
            dateCreated: 'desc'
          }
        });
      
    }

    return NextResponse.json(tickets);

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
});


// Создание нового тикета пользователем
export async function POST(request: Request) {
  try {
    const { serialNumber, orderNumber, sessionId } = await request.json();

    // Проверка серийного номер и номера заказа
    if (!serialNumber || !orderNumber || !sessionId) {
      return NextResponse.json(
        { error: 'Serial number and order number are required' },
        { status: 400 }
      );
    }

    // Проверяем существование паспорта
    const passport = await passportRepository.getBySerialAndOrder(
      serialNumber,
      orderNumber
    );
    
    if (!passport) {
      return NextResponse.json(
        { error: 'Passport not found' },
        { status: 404 }
      );
    }

    // Проверяем существование открытого тикета
    const existingTicket = await ticketRepository.getTicketByPassportId(passport.id, sessionId);

    if (existingTicket) {
      return NextResponse.json(
        { error: 'There is already an open ticket for this passport' },
        { status: 400 }
      );
    }

    // Создаем новый тикет
    const ticket = await ticketRepository.create({
      passport: {
        connect: {
          id: passport.id
        }
      },
      status: 'OPEN',
      sessionId,
      pendingClosure: false,
      confirmedByUser: false,
      messages: {
        create: []
      }
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}


// Типы для тикетов, ПК и сообщений
type Message = {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
};

type PC = {
  sn: string;
  descr: string | null;
};

type TransformedTicket = {
  id: number;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  pc: PC;
  messages: Message[];
};

// Fetch tickets with optional filtering
// export async function GET(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const url = new URL(request.url);
//     const search = url.searchParams.get('search') || '';
//     const status = url.searchParams.get('status');

//     // Получение тикетов с фильтрацией
//     const tickets = await prisma.ticket.findMany({
//       where: {
//         AND: [
//           status ? { status: status.toUpperCase() as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' } : {},
//           {
//             OR: [
//               { pc: { sn: { contains: search, mode: 'insensitive' } } },
//               { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
//             ],
//           },
//         ],
//       },
//       include: {
//         pc: {
//           select: {
//             sn: true,
//             descr: true,
//           },
//         },
//         messages: {
//           orderBy: {
//             date: 'asc',
//           },
//         },
//       },
//       orderBy: {
//         dateCreated: 'desc',
//       },
//     });

//     // Преобразование данных тикетов для фронтенда
//     const transformedTickets: TransformedTicket[] = tickets.map((ticket) => ({
//       id: ticket.id,
//       title: `Ticket #${ticket.id}`,
//       status: ticket.status,
//       createdAt: ticket.dateCreated.toISOString(),
//       pendingClosure: ticket.pendingClosure,
//       pc: {
//         sn: ticket.pc.sn,
//         descr: ticket.pc.descr,
//       },
//       messages: ticket.messages.map((message) => ({
//         id: message.id,
//         content: message.content,
//         createdAt: message.date.toISOString(),
//         isAdmin: message.isAdmin,
//       })),
//     }));

//     return NextResponse.json(transformedTickets);
//   } catch (error: any) {
//     console.error('Error fetching tickets:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to fetch tickets' },
//       { status: 500 }
//     );
//   }
// }

// Create a new ticket and its initial message
// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { pcId, content }: { pcId: number; content: string } = await request.json();

//     if (!pcId || !content) {
//       return NextResponse.json(
//         { error: 'PC ID and message content are required' },
//         { status: 400 }
//       );
//     }

//     // Проверка существования ПК
//     const pc = await prisma.pC.findUnique({
//       where: { id: pcId },
//     });

//     if (!pc) {
//       return NextResponse.json(
//         { error: 'PC not found' },
//         { status: 404 }
//       );
//     }

//     // Проверка наличия открытого тикета для данного ПК
//     const existingTicket = await prisma.ticket.findFirst({
//       where: {
//         pcId,
//         status: 'OPEN',
//       },
//     });

//     if (existingTicket) {
//       return NextResponse.json(
//         { error: 'There is already an open ticket for this PC' },
//         { status: 400 }
//       );
//     }

//     // Создание тикета и первого сообщения
//     const ticket = await prisma.$transaction(async (tx) => {
//       const newTicket = await tx.ticket.create({
//         data: {
//           pcId,
//           status: 'OPEN',
//         },
//       });

//       await tx.message.create({
//         data: {
//           ticketId: newTicket.id,
//           content,
//           isAdmin: false,
//           date: new Date(),
//         },
//       });

//       return await tx.ticket.findUnique({
//         where: { id: newTicket.id },
//         include: {
//           pc: {
//             select: {
//               sn: true,
//               descr: true,
//             },
//           },
//           messages: {
//             orderBy: {
//               date: 'asc',
//             },
//           },
//         },
//       });
//     });

//     if (!ticket) {
//       throw new Error('Failed to create ticket');
//     }

//     // Преобразование данных для фронтенда
//     const transformedTicket: TransformedTicket = {
//       id: ticket.id,
//       title: `Ticket #${ticket.id}`,
//       status: ticket.status,
//       createdAt: ticket.dateCreated.toISOString(),
//       pc: {
//         sn: ticket.pc.sn,
//         descr: ticket.pc.descr,
//       },
//       messages: ticket.messages.map((message) => ({
//         id: message.id,
//         content: message.content,
//         createdAt: message.date.toISOString(),
//         isAdmin: message.isAdmin,
//       })),
//     };

//     return NextResponse.json(transformedTicket);
//   } catch (error: any) {
//     console.error('Error creating ticket:', error);
//     return NextResponse.json(
//       { error: error.message || 'Failed to create ticket' },
//       { status: 500 }
//     );
//   }
// }
