import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  req: Request,
  context: { params: { ticketId: string } }
) {
  try {
    const { params } = context;

    // Проверка параметров
    if (!params?.ticketId || typeof params.ticketId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid parameter: ticketId' },
        { status: 400 }
      );
    }

    const ticketId = parseInt(params.ticketId, 10);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Проверка сессии
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверка роли администратора
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete tickets' },
        { status: 403 }
      );
    }

    // Получение тикета
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Проверка статуса тикета
    if (ticket.status !== 'CLOSED' || !ticket.confirmedByUser) {
      return NextResponse.json(
        { error: 'Can only delete closed and confirmed tickets' },
        { status: 400 }
      );
    }

    // Удаление данных через транзакцию
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { ticketId } }),
      prisma.ticket.delete({ where: { id: ticketId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
