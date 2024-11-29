import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextApiResponse } from 'next'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export const initSocket = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new ServerIO(res.socket.server)
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('joinTicket', (ticketId: number) => {
        console.log(`Socket ${socket.id} joining ticket: ${ticketId}`)
        socket.join(`ticket-${ticketId}`)
      })

      socket.on('leaveTicket', (ticketId: number) => {
        console.log(`Socket ${socket.id} leaving ticket: ${ticketId}`)
        socket.leave(`ticket-${ticketId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }
  return res.socket.server.io
}
