'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

import { Message } from '@/types/message'



interface Ticket {
  id: number
  title: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  createdAt: string
  messages: Message[]
  pendingClosure: boolean
  pc: {
    sn: string
    descr: string | null
  }
  
}

interface TicketFormProps {
  pcId: number
  onSuccess?: (ticket: Ticket) => void // Типизация скорректирована
}

export function TicketForm({ pcId, onSuccess }: TicketFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pcId,
          content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ticket')
      }

      setTicket(data)
      setContent('')
      toast({
        title: 'Success',
        description: 'Your ticket has been created successfully.',
      })
      onSuccess?.(data) // Передача созданного тикета
    } catch (error: any) {
      console.error('Error creating ticket:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create ticket',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-500'
      case 'IN_PROGRESS':
        return 'bg-yellow-500'
      case 'CLOSED':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {ticket ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{ticket.title}</h3>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status}
            </Badge>
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-4">
            <div className="space-y-4">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.isAdmin ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isAdmin
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {format(new Date(message.createdAt), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setTicket(null)}
            >
              Create Another Ticket
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Описание обращения
            </label>
            <Textarea
              placeholder="Пожалуйста, опишите свою проблему."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание обращения...
              </>
            ) : (
              'Создать обращения'
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
