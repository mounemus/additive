import { NextResponse } from "next/server";

/**
 * Proxy same-origin pour les modèles 3D GLB hébergés sur des hôtes externes
 * qui n'envoient pas de CORS (WordPress buypukka.ca). <model-viewer> fetch
 * le GLB depuis notre origine → ni CORS ni élargissement de CSP nécessaires.
 *
 * Sécurité :
 * - whitelist stricte d'hôtes (hostname exact, https uniquement) ;
 * - taille plafonnée à 50 Mo (Content-Length ET comptage au streaming) ;
 * - timeout amont de 20 s ;
 * - 400 pour toute URL hors périmètre.
 */

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["buypukka.ca"]);
const MAX_BYTES = 50 * 1024 * 1024; // 50 Mo
const UPSTREAM_TIMEOUT_MS = 20_000;

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src");
  if (!src) return NextResponse.json({ error: "missing_src" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      // Le GLB est un binaire public ; on laisse le CDN Vercel mettre en
      // cache la réponse via Cache-Control ci-dessous.
      headers: { Accept: "model/gltf-binary, application/octet-stream, */*" },
    });
  } catch {
    return NextResponse.json({ error: "upstream_unreachable" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  const declared = Number(upstream.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  // Streaming avec garde-fou de taille (le Content-Length peut mentir).
  let sent = 0;
  const reader = upstream.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      sent += value.byteLength;
      if (sent > MAX_BYTES) {
        controller.error(new Error("too_large"));
        await reader.cancel().catch(() => {});
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason).catch(() => {});
    },
  });

  const headers = new Headers({
    "Content-Type": "model/gltf-binary",
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });
  if (declared > 0) headers.set("Content-Length", String(declared));

  return new Response(body, { status: 200, headers });
}
