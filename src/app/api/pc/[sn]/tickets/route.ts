import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function GET(
  request: NextRequest,
  context: any) {

    if (!context.params || typeof context.params.sn !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing parameter: sn' },
        { status: 400 }
      );
    }  

  const sn = context.params.sn

  if (!sn) {
    return NextResponse.json(
      { error: 'Missing parameter: sn' },
      { status: 400 }
    )
  }

  try {
    const pc = await prisma.pC.findUnique({
      where: { sn },
      include: {
        tickets: {
          where: {
            OR: [
              { status: { not: 'CLOSED' } },
              {
                AND: [
                  { status: 'CLOSED' },
                  { confirmedByUser: false }
                ]
              }
            ]
          },
          include: {
            messages: true
          },
          orderBy: {
            dateCreated: 'desc'
          }
        }
      }
    })

    if (!pc) {
      return NextResponse.json(
        { error: 'PC not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pc.tickets)
  } catch (error) {
    console.error('Error fetching PC tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PC tickets' },
      { status: 500 }
    )
  }
}
