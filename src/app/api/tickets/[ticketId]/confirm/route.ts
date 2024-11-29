import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Confirm a ticket
export async function POST(request: NextRequest, context: { params: { ticketId: string } }) {
  try {
    const { params } = context;

    // Validate ticketId
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

    // Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Ensure the ticket is closed before confirmation
    if (ticket.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'Ticket must be closed before confirmation' },
        { status: 400 }
      );
    }

    // Confirm the ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { confirmedByUser: true },
      include: {
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true, // Changed from isAdmin to role for better consistency
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    // Transform the response for the frontend
    const transformedTicket = {
      id: updatedTicket.id,
      status: updatedTicket.status,
      confirmedByUser: updatedTicket.confirmedByUser,
      messages: updatedTicket.messages.map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.date.toISOString(),
        user: {
          id: message.user?.id,
          name: message.user?.name,
          role: message.user?.role,
        },
      })),
    };

    return NextResponse.json(transformedTicket);
  } catch (error: any) {
    console.error('Failed to confirm ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm ticket' },
      { status: 500 }
    );
  }
}
