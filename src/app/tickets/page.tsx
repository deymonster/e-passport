'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: number
  content: string
  createdAt: string
  isAdmin: boolean
}

interface Ticket {
  id: number
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  createdAt: string
  messages: Message[]
  pc: {
    sn: string
    descr: string | null
  }
}

export default function UserTicketsPage() {
  const { status } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets')
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      setTickets([])
      toast({
        title: 'Warning',
        description: 'Could not load tickets. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'CLOSED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Support Tickets</h1>
      </div>

      <Card className="bg-white">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Tickets</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-2">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block"
              >
                <div className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">PC: {ticket.pc.sn}</span>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                    {ticket.messages[0] && (
                      <div className="mt-2 text-gray-600 line-clamp-2">
                        {ticket.messages[0].content}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tickets found
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
