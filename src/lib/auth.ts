import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { User } from "next-auth";

import { NextResponse, NextRequest } from "next/server";


// Определение типа для User
type UserRole = "ADMIN" | "USER";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          console.log("User not found or no password");
          return null;
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          console.log("Invalid password");
          return null;
        }

        // Явно указываем возвращаемый объект как User
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        } as User;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as string).toUpperCase();
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: session.user?.name || null,
          role:
            token.role === "USER" || token.role === "ADMIN" ? token.role : "USER",
        };
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Функция-обертка для проверки авторизации только для администратора
export function withAdminAuth<T extends { params: { [key: string]: string } }>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: T) => {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, context); // Передаём req и context
  };
}


