// types.ts
export interface Message {
    id: number;
    content: string;
    createdAt: string;
    isAdmin: boolean;
    ticketId?: number; // Сделаем ticketId опциональным, чтобы избежать конфликтов
  }
  