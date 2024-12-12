import { NextRequest } from 'next/server';

export interface RouteContext {
  params: Record<string, string>;
}

export type RouteHandler = (
  req: NextRequest,
  context: RouteContext
) => Promise<Response>;

export interface Message {
  id: number;
  content: string;
  createdAt: Date;
  isAdmin: boolean;
  userId: string;
}

export interface Ticket {
  id: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Passport {
  id: number;
  name: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
