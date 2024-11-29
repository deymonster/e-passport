import { io, Socket } from 'socket.io-client'

class SocketClient {
  private static instance: SocketClient
  private socket: Socket | null = null

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient()
    }
    return SocketClient.instance
  }

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
        path: '/api/socketio',
        addTrailingSlash: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      this.socket.on('connect', () => {
        console.log('Socket connected')
      })

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })
    }
    return this.socket
  }

  public getSocket(): Socket | null {
    return this.socket
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export const socketClient = SocketClient.getInstance()
