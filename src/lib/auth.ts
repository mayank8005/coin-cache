import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./db";
import { verifyPassword } from "./crypto";
import { LoginSchema } from "@/utils/validation";
import { env } from "./env";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      paletteId: string;
      vizStyle: string;
      chipStyle: string;
      currency: string;
      displayName: string;
    };
  }

  interface User {
    id?: string;
    paletteId?: string;
    vizStyle?: string;
    chipStyle?: string;
    currency?: string;
    displayName?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env().AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: env().AUTH_SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (raw) => {
        const parsed = LoginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;
        const ok = await verifyPassword(user.passwordHash, parsed.data.password);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          displayName: user.displayName,
          paletteId: user.paletteId,
          vizStyle: user.vizStyle,
          chipStyle: user.chipStyle,
          currency: user.currency,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        const u = user as {
          id?: string;
          paletteId?: string;
          vizStyle?: string;
          chipStyle?: string;
          currency?: string;
          displayName?: string;
        };
        (token as Record<string, unknown>).id = u.id;
        (token as Record<string, unknown>).paletteId = u.paletteId;
        (token as Record<string, unknown>).vizStyle = u.vizStyle;
        (token as Record<string, unknown>).chipStyle = u.chipStyle;
        (token as Record<string, unknown>).currency = u.currency;
        (token as Record<string, unknown>).displayName = u.displayName;
      }
      const tid = (token as { id?: string }).id;
      if (trigger === "update" && tid) {
        const fresh = await prisma.user.findUnique({ where: { id: tid } });
        if (fresh) {
          (token as Record<string, unknown>).paletteId = fresh.paletteId;
          (token as Record<string, unknown>).vizStyle = fresh.vizStyle;
          (token as Record<string, unknown>).chipStyle = fresh.chipStyle;
          (token as Record<string, unknown>).currency = fresh.currency;
          (token as Record<string, unknown>).displayName = fresh.displayName;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      const t = token as {
        id?: string;
        paletteId?: string;
        vizStyle?: string;
        chipStyle?: string;
        currency?: string;
        displayName?: string;
      };
      if (t.id) {
        session.user.id = t.id;
        session.user.paletteId = t.paletteId ?? "matcha";
        session.user.vizStyle = t.vizStyle ?? "rings";
        session.user.chipStyle = t.chipStyle ?? "rings";
        session.user.currency = t.currency ?? "INR";
        session.user.displayName = t.displayName ?? session.user.name ?? "";
      }
      return session;
    },
  },
});
