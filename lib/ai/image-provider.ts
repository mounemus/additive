import "server-only";
import { getProvidersConfig, getProviderKey } from "@/lib/configurator-settings";

/**
 * Abstraction multi-fournisseurs pour la génération d'images.
 *
 * Règles non négociables :
 *  - aucune clé ni nom de fournisseur n'est exposé au client ;
 *  - en cas d'échec ou d'absence de configuration, on renvoie `null` et le
 *    client reçoit un message générique ('unavailable') ; les détails
 *    techniques restent dans les logs serveur ;
 *  - le repli "démo" (SVG) est géré par l'appelant, jamais ici.
 *
 * Ajouter un fournisseur = ajouter un cas dans `generateImage`.
 */

export type ImageGenRequest = {
  prompt: string;
  // Image(s) de référence en base64 (data URL) — moodboard pour conditionner
  // les concepts, photo du client pour le portrait porté.
  referenceImages?: string[];
  size?: "1024x1024" | "1024x1536" | "1536x1024";
};

export type ImageGenResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: "unavailable"; detail?: string };

function dataUrlToBase64(dataUrl: string): { mime: string; b64: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}

export async function generateImage(req: ImageGenRequest): Promise<ImageGenResult> {
  const cfg = await getProvidersConfig();
  if (cfg.imageProvider === "demo") {
    return { ok: false, error: "unavailable", detail: "demo mode" };
  }
  const key = await getProviderKey(cfg.imageProvider);
  if (!key) return { ok: false, error: "unavailable", detail: "no key" };

  try {
    switch (cfg.imageProvider) {
      case "openai":
        return await openai(req, key, cfg.imageModel);
      case "gemini":
        return await gemini(req, key, cfg.imageModel);
      case "stability":
        return await stability(req, key);
      case "replicate":
        return await replicate(req, key, cfg.imageModel);
      default:
        return { ok: false, error: "unavailable", detail: "unknown provider" };
    }
  } catch (e) {
    console.error("[image-provider] generation failed:", e);
    return { ok: false, error: "unavailable", detail: "provider error" };
  }
}

// ── OpenAI Images (gpt-image-1 / dall-e-3) ──────────────────────────────────
async function openai(req: ImageGenRequest, key: string, model: string): Promise<ImageGenResult> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model || "gpt-image-1",
      prompt: req.prompt,
      size: req.size ?? "1024x1024",
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error("[image-provider] openai status", res.status, await safeText(res));
    return { ok: false, error: "unavailable", detail: `http ${res.status}` };
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;
  if (b64) return { ok: true, dataUrl: `data:image/png;base64,${b64}` };
  if (url) return { ok: true, dataUrl: url };
  return { ok: false, error: "unavailable", detail: "empty response" };
}

// ── Google Gemini (image) ───────────────────────────────────────────────────
async function gemini(req: ImageGenRequest, key: string, model: string): Promise<ImageGenResult> {
  const m = model || "gemini-2.5-flash-image";
  const parts: unknown[] = [{ text: req.prompt }];
  for (const ref of req.referenceImages ?? []) {
    const parsed = dataUrlToBase64(ref);
    if (parsed) parts.push({ inline_data: { mime_type: parsed.mime, data: parsed.b64 } });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // responseModalities IMAGE est requis par les modèles de génération
      // d'images Gemini (Nano Banana) pour renvoyer une image inline.
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    }
  );
  if (!res.ok) {
    console.error("[image-provider] gemini status", res.status, await safeText(res));
    return { ok: false, error: "unavailable", detail: `http ${res.status}` };
  }
  const data = await res.json();
  const outParts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const p of outParts) {
    const inline = p.inline_data ?? p.inlineData;
    if (inline?.data) {
      const mime = inline.mime_type ?? inline.mimeType ?? "image/png";
      return { ok: true, dataUrl: `data:${mime};base64,${inline.data}` };
    }
  }
  return { ok: false, error: "unavailable", detail: "no image part" };
}

// ── Stability AI ─────────────────────────────────────────────────────────────
async function stability(req: ImageGenRequest, key: string): Promise<ImageGenResult> {
  const form = new FormData();
  form.append("prompt", req.prompt);
  form.append("output_format", "png");
  const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "image/*" },
    body: form,
  });
  if (!res.ok) {
    console.error("[image-provider] stability status", res.status, await safeText(res));
    return { ok: false, error: "unavailable", detail: `http ${res.status}` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { ok: true, dataUrl: `data:image/png;base64,${buf.toString("base64")}` };
}

// ── Replicate (poll court) ───────────────────────────────────────────────────
async function replicate(req: ImageGenRequest, key: string, model: string): Promise<ImageGenResult> {
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ model: model || "black-forest-labs/flux-1.1-pro", input: { prompt: req.prompt } }),
  });
  if (!create.ok) {
    console.error("[image-provider] replicate status", create.status, await safeText(create));
    return { ok: false, error: "unavailable", detail: `http ${create.status}` };
  }
  const data = await create.json();
  const out = Array.isArray(data?.output) ? data.output[0] : data?.output;
  if (typeof out === "string" && out.startsWith("http")) return { ok: true, dataUrl: out };
  return { ok: false, error: "unavailable", detail: "no output url" };
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "";
  }
}

/**
 * Test de connectivité d'une clé (utilisé par l'admin pour le badge de statut).
 * Ne génère pas d'image — vérifie juste l'authentification.
 */
export async function testProviderKey(providerId: string, key: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    if (providerId === "openai" || providerId === "openai-vision") {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return { ok: r.ok, detail: r.ok ? "authentifié" : `http ${r.status}` };
    }
    if (providerId === "gemini") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      return { ok: r.ok, detail: r.ok ? "authentifié" : `http ${r.status}` };
    }
    if (providerId === "stability") {
      const r = await fetch("https://api.stability.ai/v1/user/account", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return { ok: r.ok, detail: r.ok ? "authentifié" : `http ${r.status}` };
    }
    if (providerId === "replicate") {
      const r = await fetch("https://api.replicate.com/v1/account", {
        headers: { Authorization: `Bearer ${key}` },
      });
      return { ok: r.ok, detail: r.ok ? "authentifié" : `http ${r.status}` };
    }
    return { ok: false, detail: "fournisseur inconnu" };
  } catch (e) {
    console.error("[image-provider] test failed:", e);
    return { ok: false, detail: "erreur réseau" };
  }
}
