import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { PUBLIC_URL } from "@/lib/base-path";
import { logAudit } from "@/lib/audit";

/**
 * Connexion automatique depuis WordPress (menu Additive → écrans admin).
 *
 * Le plugin signe `{ email, exp }` avec WP_SYNC_SECRET (HMAC-SHA256, 60 s).
 * On vérifie la signature, on retrouve l'admin, puis on pose directement le
 * cookie de session NextAuth et on redirige vers l'écran demandé.
 * Seuls les administrateurs WordPress (manage_options) reçoivent un jeton.
 */
export const dynamic = "force-dynamic";

function b64url(s: string) {
  return Buffer.from(s, "base64url");
}

export async function GET(req: Request) {
  const secret = process.env.WP_SYNC_SECRET;
  const authSecret = process.env.NEXTAUTH_SECRET;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const to = url.searchParams.get("to") ?? "/admin/dashboard";
  const login = NextResponse.redirect(`${PUBLIC_URL}/admin/login?callbackUrl=${encodeURIComponent(to)}`);

  if (!secret || !authSecret) return login;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return login;

  const expected = createHmac("sha256", secret).update(payload).digest();
  const given = b64url(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return login;

  let claims: { email?: string; exp?: number };
  try {
    claims = JSON.parse(b64url(payload).toString("utf8"));
  } catch {
    return login;
  }
  if (!claims.exp || claims.exp < Date.now() / 1000) return login;

  // L'admin WordPress devient l'admin Next du même e-mail, sinon le premier admin.
  const email = (claims.email ?? "").toLowerCase().trim();
  const user =
    (email ? await db.adminUser.findUnique({ where: { email } }) : null) ??
    (await db.adminUser.findFirst({ orderBy: { createdAt: "asc" } }));
  if (!user) return login;

  const jwt = await encode({
    secret: authSecret,
    token: { sub: user.id, id: user.id, email: user.email, name: user.name ?? "Admin" },
    maxAge: 8 * 60 * 60,
  });

  // Seuls les chemins admin internes sont acceptés comme destination.
  const dest = /^\/admin(\/[\w-]*)*$/.test(to) ? to : "/admin/dashboard";
  const res = NextResponse.redirect(`${PUBLIC_URL}${dest}`);
  res.cookies.set("__Secure-next-auth.session-token", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  logAudit("login", "AdminUser", user.id, `SSO WordPress (${email || "sans e-mail"})`);
  return res;
}
