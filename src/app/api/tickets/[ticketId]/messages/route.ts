import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const ticketId = Number(url.pathname.split('/')[3]);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content }: { content: string } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required and cannot be empty' },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === 'ADMIN';

    console.log('Ticket ID :', ticketId);

    // Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { 
        pc: true,
        messages: true,
      },
    });
    console.log('Ticket:', ticket);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Ensure the user has joined the ticket room (if necessary)
    if (!isAdmin && ticket.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'You must join the ticket room before sending messages' },
        { status: 400 }
      );
    }

    // Create the message
    const newMessage = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          ticketId,
          content: content.trim(),
          userId: Number(session.user.id),
          isAdmin,
          date: new Date(),
        },
      });

      // If an admin responds, update the ticket status to "IN_PROGRESS"
      if (isAdmin && ticket.status === 'OPEN') {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return message;
    });

    // Emit the new message event through WebSocket
    if (request.socket?.server?.io) {
      // @ts-ignore - Next.js types don't include socket
      request.socket.server.io.to(`ticket-${ticketId}`).emit('newMessage', {
        id: newMessage.id,
        content: newMessage.content,
        createdAt: newMessage.date.toISOString(),
        isAdmin: newMessage.isAdmin,
      });
    }

    return NextResponse.json({
      id: newMessage.id,
      content: newMessage.content,
      createdAt: newMessage.date.toISOString(),
      isAdmin: newMessage.isAdmin,
    });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const ticketId = Number(url.pathname.split('/')[3]);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      ticket.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.date.toISOString(),
        isAdmin: message.isAdmin,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
