import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ADMIN_PASSWORD, ADMIN_USERNAME, NEXTAUTH_SECRET } from "@/lib/auth-env";

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/admin/login"
  },
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");

        if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
          return null;
        }

        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
          return null;
        }

        return {
          id: "admin",
          name: ADMIN_USERNAME
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name ?? token.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
      }

      return session;
    }
  }
};
