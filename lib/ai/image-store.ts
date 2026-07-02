import "server-only";
import { createHash } from "crypto";
import { db } from "@/lib/db";

/**
 * Persistance + cache des images générées par IA.
 *
 * PERSISTANCE : si un store Vercel Blob est configuré (BLOB_READ_WRITE_TOKEN,
 * injecté automatiquement quand on crée un store dans le dashboard Vercel),
 * chaque image générée est déposée sur le CDN et on ne fait plus circuler que
 * son URL — payloads minuscules, images qui survivent au refresh. Sans store,
 * repli transparent : l'image reste une data URL (comportement historique).
 *
 * CACHE : même profil + même tâche = même image réutilisée pendant TTL_HOURS
 * au lieu d'une régénération payante. Le portrait porté n'est JAMAIS mis en
 * cache (photo personnelle). Fail-open : toute erreur de cache = génération
 * normale, jamais de blocage.
 *
 * JOURNAL : chaque appel fournisseur est tracé (tâche, provider, latence,
 * succès, cache) dans AiCallLog pour le pilotage des coûts depuis l'admin.
 */

const TTL_HOURS = 7 * 24;
// Sans Blob, on borne ce qu'on accepte de mettre en cache en base.
const MAX_INLINE_CACHE_BYTES = 2_500_000;

export function makeCacheKey(task: string, parts: unknown[]): string {
  const raw = JSON.stringify(parts);
  return `${task}:${createHash("sha256").update(raw).digest("hex")}`;
}

export async function getCachedImage(cacheKey: string): Promise<string | null> {
  try {
    const row = await db.generatedImage.findUnique({ where: { cacheKey } });
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) {
      db.generatedImage.delete({ where: { cacheKey } }).catch(() => {});
      return null;
    }
    return row.url;
  } catch {
    return null;
  }
}

/**
 * Persiste l'image (Blob si possible) puis l'enregistre en cache.
 * Renvoie l'URL à servir au client (URL CDN ou data URL d'origine).
 */
export async function persistAndCache(
  cacheKey: string | null,
  task: string,
  provider: string | undefined,
  dataUrl: string
): Promise<string> {
  const url = await persistImage(dataUrl, task);
  if (cacheKey) {
    const cacheable = url.startsWith("http") || url.length <= MAX_INLINE_CACHE_BYTES;
    if (cacheable) {
      const expiresAt = new Date(Date.now() + TTL_HOURS * 3600_000);
      db.generatedImage
        .upsert({
          where: { cacheKey },
          create: { cacheKey, task, provider: provider ?? null, url, expiresAt },
          update: { url, provider: provider ?? null, expiresAt },
        })
        .catch((e) => console.error("[image-store] cache write:", e));
    }
  }
  return url;
}

/** Dépose une data URL sur Vercel Blob. Repli : renvoie la data URL telle quelle. */
async function persistImage(dataUrl: string, task: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return dataUrl;
  const m = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) return dataUrl;
  try {
    const { put } = await import("@vercel/blob");
    const ext = m[1].includes("png") ? "png" : m[1].includes("webp") ? "webp" : "jpg";
    const buf = Buffer.from(m[2], "base64");
    const blob = await put(`gen/${task}/${createHash("sha1").update(buf).digest("hex")}.${ext}`, buf, {
      access: "public",
      contentType: m[1],
      addRandomSuffix: false, // même contenu = même URL (déduplication naturelle)
    });
    return blob.url;
  } catch (e) {
    console.error("[image-store] blob indisponible (repli data URL):", e);
    return dataUrl;
  }
}

/** Journalise un appel fournisseur (fire-and-forget, jamais bloquant). */
export function logAiCall(entry: {
  task: string;
  provider: string;
  model?: string;
  ok: boolean;
  cached?: boolean;
  latencyMs: number;
  detail?: string;
}): void {
  db.aiCallLog
    .create({
      data: {
        task: entry.task,
        provider: entry.provider,
        model: entry.model ?? null,
        ok: entry.ok,
        cached: entry.cached ?? false,
        latencyMs: Math.round(entry.latencyMs),
        detail: entry.detail?.slice(0, 300) ?? null,
      },
    })
    .catch(() => {});
}
