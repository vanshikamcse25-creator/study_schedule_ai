import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { loginSchema } from "@/lib/validations";

// Fix for Vercel dynamic host resolution: ensure AUTH_URL always matches the active Vercel deployment URL
if (process.env.VERCEL_URL) {
  const currentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (currentHost && !currentHost.includes("localhost")) {
    const currentUrl = `https://${currentHost}`;
    if (!process.env.AUTH_URL || !process.env.AUTH_URL.includes(currentHost)) {
      process.env.AUTH_URL = currentUrl;
      process.env.NEXTAUTH_URL = currentUrl;
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "studyflow_ai_super_secret_auth_key_2026",
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0] || "Student",
              password: hashedPassword,
              profile: { create: {} },
              studyStreak: { create: {} },
            },
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        }

        if (user.password) {
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) {
            const newHashed = await bcrypt.hash(password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: newHashed },
            });
          }
        } else {
          const hashedPassword = await bcrypt.hash(password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string);
        session.user.name = token.name as string;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
});
