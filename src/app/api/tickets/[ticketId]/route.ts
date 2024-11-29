import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Props {
  params: {
    ticketId: string;
  };
}

// Update ticket status
export async function PATCH(request: NextRequest, context: Props) {
  try {
    const { params } = context;

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

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status }: { status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' } = await request.json();
    if (!status || !['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Allowed values: OPEN, IN_PROGRESS, CLOSED.' },
        { status: 400 }
      );
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        messages: {
          orderBy: { date: 'asc' },
          include: { user: true },
        },
        pc: {
          select: { sn: true, descr: true },
        },
      },
    });

    // Transform response
    const transformedTicket = {
      id: updatedTicket.id,
      title: `Ticket #${updatedTicket.id}`,
      status: updatedTicket.status,
      createdAt: updatedTicket.dateCreated.toISOString(),
      messages: updatedTicket.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.date.toISOString(),
        isAdmin: !!message.user?.isAdmin,
      })),
      pc: {
        sn: updatedTicket.pc.sn,
        descr: updatedTicket.pc.descr,
      },
    };

    return NextResponse.json(transformedTicket);
  } catch (error: any) {
    console.error('Failed to update ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

// Create a new message in a ticket
export async function POST(request: NextRequest, context: Props) {
  try {
    const { params } = context;

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

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content }: { content: string } = await request.json();
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // Ensure the ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        ticketId,
        content: content.trim(),
        userId: Number(session.user.id),
        date: new Date(),
      },
      include: { user: true },
    });

    // Update ticket status if the message is from an admin and the ticket is open
    if (session.user.role === 'ADMIN' && ticket.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({
      id: newMessage.id,
      content: newMessage.content,
      createdAt: newMessage.date.toISOString(),
      isAdmin: !!newMessage.user?.isAdmin,
    });
  } catch (error: any) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}
