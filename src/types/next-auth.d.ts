import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: "USER" | "ADMIN"; // Добавляем поле role
  }

  interface Session {
    user?: {
      id: string;
      email: string;
      name?: string | null;
      role: "USER" | "ADMIN"; // Добавляем поле role
    };
  }

  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: "USER" | "ADMIN"; // Добавляем поле role
  }
}
