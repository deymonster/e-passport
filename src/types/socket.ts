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
