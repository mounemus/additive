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
  return geminiGenerate(req.prompt, req.referenceImages ?? [], key, model || "gemini-2.5-flash-image");
}

/**
 * Appel direct Gemini generateContent (texte + images de référence inline).
 * Réutilisé pour le portrait porté (photo + concept) et l'overlay.
 * responseModalities IMAGE est OBLIGATOIRE pour Nano Banana.
 */
async function geminiGenerate(
  prompt: string,
  refs: string[],
  key: string,
  model: string
): Promise<ImageGenResult> {
  const m = model || "gemini-2.5-flash-image";
  const parts: unknown[] = [{ text: prompt }];
  for (const ref of refs) {
    const parsed = dataUrlToBase64(ref);
    if (parsed) parts.push({ inline_data: { mime_type: parsed.mime, data: parsed.b64 } });
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
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

function dataUrlToBlob(dataUrl: string): Blob | null {
  const parsed = dataUrlToBase64(dataUrl);
  if (!parsed) return null;
  return new Blob([Buffer.from(parsed.b64, "base64")], { type: parsed.mime });
}

/**
 * Portrait porté FIDÈLE : préfère Gemini (édition photo + image du concept,
 * identité strictement préservée), repli OpenAI /images/edits (UNE image =
 * la photo, input_fidelity high). Jamais /images/generations (inventerait un
 * visage). Hérité de generate_wearing_image du plugin.
 */
export async function generateWornPortrait(opts: {
  prompt: string;
  photo: string;
  conceptImage?: string;
}): Promise<ImageGenResult> {
  const geminiKey = await getProviderKey("gemini");
  if (geminiKey) {
    const refs = [opts.photo];
    if (opts.conceptImage && opts.conceptImage.startsWith("data:")) refs.push(opts.conceptImage);
    const r = await geminiGenerate(opts.prompt, refs, geminiKey, "gemini-2.5-flash-image");
    if (r.ok) return r;
  }
  const openaiKey = await getProviderKey("openai");
  if (openaiKey) {
    try {
      const blob = dataUrlToBlob(opts.photo);
      if (!blob) return { ok: false, error: "unavailable", detail: "bad photo" };
      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image", blob, "photo.png");
      form.append("prompt", opts.prompt);
      form.append("size", "1024x1024");
      form.append("input_fidelity", "high");
      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
      });
      if (!res.ok) {
        console.error("[image-provider] openai edits", res.status, await safeText(res));
        return { ok: false, error: "unavailable", detail: `http ${res.status}` };
      }
      const data = await res.json();
      const b64 = data?.data?.[0]?.b64_json;
      if (b64) return { ok: true, dataUrl: `data:image/png;base64,${b64}` };
    } catch (e) {
      console.error("[image-provider] openai edits error", e);
    }
  }
  return { ok: false, error: "unavailable", detail: "no portrait provider" };
}

/**
 * Façade transparente pour l'essayage AR. OpenAI gpt-image-1 produit un alpha
 * natif (background:transparent) ; Gemini ne sait pas faire d'alpha → fond
 * blanc pur + détourage côté client (bg:'white'). Hérité de
 * generate_frame_overlay du plugin.
 */
export async function generateFrameOverlay(opts: {
  prompt: string;
}): Promise<{ ok: true; dataUrl: string; bg: "transparent" | "white" } | { ok: false }> {
  const openaiKey = await getProviderKey("openai");
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: opts.prompt,
          size: "1024x1024",
          background: "transparent",
          n: 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (b64) return { ok: true, dataUrl: `data:image/png;base64,${b64}`, bg: "transparent" };
      } else {
        console.error("[image-provider] overlay openai", res.status, await safeText(res));
      }
    } catch (e) {
      console.error("[image-provider] overlay openai error", e);
    }
  }
  const geminiKey = await getProviderKey("gemini");
  if (geminiKey) {
    const r = await geminiGenerate(
      `${opts.prompt} Fond blanc pur uni #FFFFFF, sans ombre, sans décor.`,
      [],
      geminiKey,
      "gemini-2.5-flash-image"
    );
    if (r.ok) return { ok: true, dataUrl: r.dataUrl, bg: "white" };
  }
  return { ok: false };
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
