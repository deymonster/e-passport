import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { sn, pin } = await request.json()

    if (!sn || !pin) {
      return NextResponse.json(
        { error: 'Serial number and PIN are required' },
        { status: 400 }
      )
    }

    const pc = await prisma.pC.findFirst({
      where: {
        sn,
        pin
      },
      include: {
        tickets: {
          include: {
            messages: {
              orderBy: {
                date: 'asc'
              }
            }
          },
          orderBy: {
            dateCreated: 'desc'
          }
        }
      }
    })

    if (!pc) {
      return NextResponse.json(
        { error: 'Invalid serial number or PIN' },
        { status: 404 }
      )
    }

    // Transform messages to match the frontend interface
    const transformedPc = {
      ...pc,
      tickets: pc.tickets.map(ticket => ({
        ...ticket,
        messages: ticket.messages.map(message => ({
          id: message.id,
          content: message.content,
          createdAt: message.date.toISOString(),
          isAdmin: message.isAdmin
        }))
      }))
    }

    return NextResponse.json(transformedPc)
  } catch (error: any) {
    console.error('Error checking PC:', error)
    return NextResponse.json(
      { error: error.message || 'Error checking PC. Please try again.' },
      { status: 500 }
    )
  }
}
