import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');

    // Получение тикетов с фильтрацией
    const tickets = await prisma.ticket.findMany({
      where: {
        AND: [
          status ? { status: status.toUpperCase() as 'OPEN' | 'IN_PROGRESS' | 'CLOSED' } : {},
          {
            OR: [
              { pc: { sn: { contains: search, mode: 'insensitive' } } },
              { messages: { some: { content: { contains: search, mode: 'insensitive' } } } },
            ],
          },
        ],
      },
      include: {
        pc: {
          select: {
            sn: true,
            descr: true,
          },
        },
        messages: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        dateCreated: 'desc',
      },
    });

    // Преобразование данных тикетов для фронтенда
    const transformedTickets: TransformedTicket[] = tickets.map((ticket) => ({
      id: ticket.id,
      title: `Ticket #${ticket.id}`,
      status: ticket.status,
      createdAt: ticket.dateCreated.toISOString(),
      pendingClosure: ticket.pendingClosure,
      pc: {
        sn: ticket.pc.sn,
        descr: ticket.pc.descr,
      },
      messages: ticket.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.date.toISOString(),
        isAdmin: message.isAdmin,
      })),
    }));

    return NextResponse.json(transformedTickets);
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// Create a new ticket and its initial message
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { pcId, content }: { pcId: number; content: string } = await request.json();

    if (!pcId || !content) {
      return NextResponse.json(
        { error: 'PC ID and message content are required' },
        { status: 400 }
      );
    }

    // Проверка существования ПК
    const pc = await prisma.pC.findUnique({
      where: { id: pcId },
    });

    if (!pc) {
      return NextResponse.json(
        { error: 'PC not found' },
        { status: 404 }
      );
    }

    // Проверка наличия открытого тикета для данного ПК
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        pcId,
        status: 'OPEN',
      },
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: 'There is already an open ticket for this PC' },
        { status: 400 }
      );
    }

    // Создание тикета и первого сообщения
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          pcId,
          status: 'OPEN',
        },
      });

      await tx.message.create({
        data: {
          ticketId: newTicket.id,
          content,
          isAdmin: false,
          date: new Date(),
        },
      });

      return await tx.ticket.findUnique({
        where: { id: newTicket.id },
        include: {
          pc: {
            select: {
              sn: true,
              descr: true,
            },
          },
          messages: {
            orderBy: {
              date: 'asc',
            },
          },
        },
      });
    });

    if (!ticket) {
      throw new Error('Failed to create ticket');
    }

    // Преобразование данных для фронтенда
    const transformedTicket: TransformedTicket = {
      id: ticket.id,
      title: `Ticket #${ticket.id}`,
      status: ticket.status,
      createdAt: ticket.dateCreated.toISOString(),
      pc: {
        sn: ticket.pc.sn,
        descr: ticket.pc.descr,
      },
      messages: ticket.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.date.toISOString(),
        isAdmin: message.isAdmin,
      })),
    };

    return NextResponse.json(transformedTicket);
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
