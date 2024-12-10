import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { NextApiRequest } from "next";

export type NextApiRequestWithSocket = NextApiRequest & {
  socket: {
    server: HttpServer & {
      io?: SocketServer;
    };
  };
};


export interface ServerToClientEvents {
  newMessage: (message: {
    id: number;
    content: string;
    isAdmin: boolean;
    createdAt: string;
  }) => void;
  ticketStatusChanged: (data: {
    ticketId: number;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    pendingClosure: boolean;
  }) => void;
}

export interface ClientToServerEvents {
  joinTicket: (ticketId: number) => void;
  leaveTicket: (ticketId: number) => void;
  message: (data: {
    ticketId: number;
    content: string;
    isAdmin: boolean;
  }) => void;
}