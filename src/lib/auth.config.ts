import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/admin") ||
        pathname.startsWith("/api/health") ||
        pathname === "/api/users" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/fonts") ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/sw.js" ||
        pathname === "/favicon.ico";
      if (isPublic) return true;
      return !!auth;
    },
  },
};
