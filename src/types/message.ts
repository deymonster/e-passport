// types.ts
export interface Message {
  id: number;
  content: string;
  createdAt: string;
  isAdmin: boolean;
  role: 'user' | 'admin';
  ticketId?: number; // Сделаем ticketId опциональным, чтобы избежать конфликтов
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface Ticket {
  id: number;
  status: TicketStatus;
  createdAt: string;
  messages: Message[];
  pendingClosure: boolean;
  sessionId: string;
}

export interface Document {
  id: number;
  name: string;
  filePath: string;
}

export interface RegistryRecord {
  id: number;
  name: string;
  url: string;
}

export interface Passport {
  id: number;
  sn: string;
  orderNumber: string;
  name: string;
  type: string;
  productionDate: string;
  warrantyPeriod: string;
  documents: { document: Document }[];
  registryRecord?: RegistryRecord;
}