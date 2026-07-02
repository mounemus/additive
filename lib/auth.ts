import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { open } from "@/lib/secret-box";
import { verifyTotp } from "@/lib/totp";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        totp: { label: "Code 2FA", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Anti brute-force : 5 tentatives / 15 min par IP+email.
        const fwd = (req?.headers?.["x-forwarded-for"] as string | undefined) ?? "unknown";
        const ip = fwd.split(",")[0].trim();
        const email = credentials.email.toLowerCase().trim();
        const rl = await rateLimit("login", `${ip}:${email}`, 5, 900);
        if (!rl.ok) return null;

        const user = await db.adminUser.findUnique({ where: { email } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // 2FA TOTP : si activé, le code à 6 chiffres est obligatoire.
        if (user.totpEnabled) {
          if (!user.totpSecret) return null;
          const secret = open(user.totpSecret);
          if (!secret) return null;
          if (!verifyTotp(secret, credentials.totp ?? "")) return null;
        }

        return { id: user.id, email: user.email, name: user.name ?? "Admin" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

/** Garde serveur pour les routes API admin. Retourne la session ou null. */
export async function requireAdmin() {
  const session = await auth();
  return session?.user ? session : null;
}
