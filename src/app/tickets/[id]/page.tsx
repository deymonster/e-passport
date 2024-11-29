import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TicketChat } from '@/components/chat/ticket-chat'

interface User {
  id: number
  name: string
  role: string
}

interface Message {
  id: number
  content: string
  date: Date
  user: User
}

interface Pc {
  sn: string
  descr: string
}

interface Ticket {
  id: number
  status: string
  dateCreated: Date
  messages: Message[]
  pc: Pc
}

// Функция для получения тикета из базы данных
async function getTicket(id: number, userEmail: string): Promise<Ticket | null> {
  return await prisma.ticket.findFirst({
    where: {
      id,
      pc: {
        tickets: {
          some: {
            messages: {
              some: {
                user: {
                  email: userEmail
                }
              }
            }
          }
        }
      }
    },
    include: {
      pc: true,
      messages: {
        include: {
          user: true
        },
        orderBy: {
          date: 'asc'
        }
      }
    }
  })
}

// Главный компонент страницы
export default async function TicketPage({ params }: any) {
  // Проверка параметров вручную
  if (!params || typeof params.id !== 'string') {
    console.error('Invalid parameters:', params)
    return notFound()
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return notFound()

  const ticketId = parseInt(params.id)
  if (isNaN(ticketId)) return notFound()

  const ticket = await getTicket(ticketId, session.user.email)
  if (!ticket) return notFound()

  const messages = ticket.messages.map((message) => ({
    id: message.id,
    content: message.content,
    createdAt: message.date.toISOString(),
    isAdmin: message.user.role === 'ADMIN'
  }))

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          Ticket for PC: {ticket.pc.sn}
        </h1>
        <p className="text-muted-foreground">
          Status: <span className="font-medium">{ticket.status}</span>
        </p>
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <TicketChat
          ticketId={ticket.id}
          messages={messages}
        />
      </div>
    </div>
  )
}
