import "server-only";
import { db } from "@/lib/db";

/**
 * Rate-limit à fenêtre fixe, adossé à Postgres (aucune infra supplémentaire).
 *
 * Protège en priorité les routes de GÉNÉRATION IA (chaque appel coûte de
 * l'argent), les formulaires publics (spam) et le login admin (brute-force).
 *
 * Fail-open : si la base est indisponible, on laisse passer — le site ne doit
 * jamais tomber à cause du limiteur. Les fenêtres expirées sont purgées de
 * façon opportuniste (~2 % des écritures), pas besoin de cron.
 */

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSec * 1000));
  const key = `${scope}:${identifier}:${windowStart}`;
  const resetAt = new Date((windowStart + 1) * windowSec * 1000);

  try {
    const row = await db.rateLimitWindow.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: { increment: 1 } },
    });

    // Purge opportuniste des fenêtres expirées.
    if (Math.random() < 0.02) {
      db.rateLimitWindow.deleteMany({ where: { resetAt: { lt: new Date(now) } } }).catch(() => {});
    }

    if (row.count > limit) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((resetAt.getTime() - now) / 1000)) };
    }
    return { ok: true };
  } catch (e) {
    console.error("[rate-limit] indisponible (fail-open):", e);
    return { ok: true };
  }
}

/** IP du client derrière le proxy Vercel. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Garde prête à l'emploi pour une route : renvoie une Response 429 si la
 * limite est atteinte, null sinon. Plusieurs règles = toutes doivent passer.
 */
export async function guard(
  req: Request,
  scope: string,
  rules: readonly { limit: number; windowSec: number }[]
): Promise<Response | null> {
  const ip = clientIp(req);
  for (const r of rules) {
    const res = await rateLimit(`${scope}:${r.windowSec}`, ip, r.limit, r.windowSec);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "rate_limited", message: "Trop de requêtes. Réessayez dans un instant." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(res.retryAfterSec),
          },
        }
      );
    }
  }
  return null;
}

/** Règles standard. */
export const RULES = {
  // Génération d'images : chaque appel coûte — rafale ET volume horaire bornés.
  ai: [
    { limit: 10, windowSec: 60 },
    { limit: 60, windowSec: 3600 },
  ],
  // Formulaires publics (contact, newsletter, demande atelier).
  form: [
    { limit: 3, windowSec: 60 },
    { limit: 10, windowSec: 3600 },
  ],
  // Upload de photos temporaires.
  photo: [
    { limit: 5, windowSec: 60 },
    { limit: 20, windowSec: 3600 },
  ],
} as const;
