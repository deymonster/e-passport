import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function initSocketServer(server: NetServer) {
  const io = new SocketIOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('joinTicket', (ticketId: number) => {
      const room = `ticket-${ticketId}`
      socket.join(room)
      console.log(`Client ${socket.id} joined room ${room}`)
    })

    socket.on('leaveTicket', (ticketId: number) => {
      const room = `ticket-${ticketId}`
      socket.leave(room)
      console.log(`Client ${socket.id} left room ${room}`)
    })

    socket.on('message', async ({ ticketId, content, isAdmin }) => {
      const room = `ticket-${ticketId}`
      io.to(room).emit('newMessage', {
        id: Date.now(),
        content,
        isAdmin,
        createdAt: new Date().toISOString(),
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}
