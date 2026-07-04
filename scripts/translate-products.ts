/**
 * Traduction one-shot du contenu produits — les descriptions importées de
 * WordPress sont en ANGLAIS alors que `description`/`shortDescription`
 * doivent être LE FRANÇAIS (les pages EN lisent `descriptionEn`/
 * `shortDescriptionEn` avec repli FR).
 *
 * Pour chaque produit dont la description SEMBLE anglaise (heuristique mots
 * courants the/and/with/is…) et dont les champs En sont vides :
 *   1. copie l'original anglais dans descriptionEn/shortDescriptionEn ;
 *   2. traduit en français de marque soigné via Gemini (gemini-2.5-flash,
 *      clé résolue par getProviderKey("gemini") : config admin puis env) ;
 *   3. écrit la traduction dans description/shortDescription.
 *
 * Idempotent : un produit dont descriptionEn/shortDescriptionEn est déjà
 * rempli est ignoré. Les shortcodes WordPress sont retirés avant traduction.
 *
 * DRY-RUN PAR DÉFAUT — rien n'est écrit sans le flag --apply :
 *   npm run translate:products              (aperçu)
 *   npm run translate:products -- --apply   (écrit en base)
 * ou directement (le flag --conditions neutralise le garde "server-only") :
 *   npx tsx --conditions=react-server scripts/translate-products.ts [--apply]
 *
 * Requiert DATABASE_URL (et NEXTAUTH_SECRET si la clé Gemini est scellée en
 * base ; sinon GEMINI_API_KEY dans l'env suffit).
 */

import { db } from "../lib/db";
import { stripShortcodes } from "../lib/catalog";
import { getProviderKey } from "../lib/configurator-settings";

const APPLY = process.argv.includes("--apply");
const GEMINI_MODEL = "gemini-2.5-flash";

// ── Heuristique « ce texte est en anglais » ─────────────────────────────────
// Mots-outils anglais très fréquents qui n'existent pas tels quels en
// français : 2 occurrences suffisent à trancher sur un texte de fiche produit.
const EN_WORDS_RE =
  /\b(the|and|with|is|are|this|these|its|your|our|from|of|has|have)\b/gi;

function looksEnglish(text: string): boolean {
  const hits = text.match(EN_WORDS_RE)?.length ?? 0;
  return hits >= 2;
}

// ── Appel Gemini texte (JSON strict en sortie) ──────────────────────────────

type TranslationOut = {
  description: string | null;
  shortDescription: string | null;
};

async function geminiTranslate(
  key: string,
  input: { name: string; description: string | null; shortDescription: string | null }
): Promise<TranslationOut> {
  const prompt = [
    "Tu es le rédacteur de marque d'ADDITIVE, lunetterie montréalaise de montures imprimées en 3D (nylon PA12, production à la demande).",
    "Traduis en FRANÇAIS les textes produit ci-dessous, dans un français de marque soigné : ton premium et sobre, précis techniquement, sans anglicismes inutiles, sans emphase publicitaire artificielle. Conserve les valeurs chiffrées, unités et noms propres (dont le nom du modèle) tels quels.",
    "Réponds UNIQUEMENT avec un objet JSON de la forme {\"description\": string|null, \"shortDescription\": string|null} : traduction de chaque champ fourni, null pour un champ absent. Aucun texte hors du JSON.",
    "",
    `Nom du modèle : ${input.name}`,
    `shortDescription : ${input.shortDescription ?? "null"}`,
    `description : ${input.description ?? "null"}`,
  ].join("\n");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`gemini http ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");
  if (!text) throw new Error("gemini: réponse vide");
  const parsed = JSON.parse(text) as Partial<TranslationOut>;
  return {
    description:
      typeof parsed.description === "string" && parsed.description.trim()
        ? parsed.description.trim()
        : null,
    shortDescription:
      typeof parsed.shortDescription === "string" && parsed.shortDescription.trim()
        ? parsed.shortDescription.trim()
        : null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Boucle principale ────────────────────────────────────────────────────────

async function main() {
  console.log(
    APPLY
      ? "Mode APPLY : les traductions seront écrites en base."
      : "Mode DRY-RUN (défaut) : aucune écriture — relancer avec --apply."
  );

  const key = await getProviderKey("gemini");
  if (!key) {
    if (APPLY) {
      console.error(
        "✗ Aucune clé Gemini disponible (config admin ou GEMINI_API_KEY). Abandon."
      );
      process.exitCode = 1;
      return;
    }
    console.warn(
      "! Aucune clé Gemini détectée — le dry-run continue, --apply échouera."
    );
  }

  const products = await db.product
    .findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        shortDescription: true,
        descriptionEn: true,
        shortDescriptionEn: true,
      },
    })
    .catch((e: unknown) => {
      if (typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2022") {
        throw new Error(
          "Les colonnes descriptionEn/shortDescriptionEn n'existent pas encore en base — exécutez `npx prisma db push` avant ce script."
        );
      }
      throw e;
    });
  console.log(`${products.length} produit(s) en base.\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of products) {
    const tag = `[${p.slug}]`;

    // Idempotence : champs En déjà remplis → déjà migré, on ne retouche rien.
    if (p.descriptionEn?.trim() || p.shortDescriptionEn?.trim()) {
      console.log(`${tag} skip — descriptionEn déjà remplie.`);
      skipped += 1;
      continue;
    }

    // Shortcodes WordPress retirés AVANT analyse et traduction.
    const description = stripShortcodes(p.description);
    const shortDescription = stripShortcodes(p.shortDescription);
    if (!description && !shortDescription) {
      console.log(`${tag} skip — aucune description.`);
      skipped += 1;
      continue;
    }

    const combined = [shortDescription, description].filter(Boolean).join("\n");
    if (!looksEnglish(combined)) {
      console.log(`${tag} skip — semble déjà en français.`);
      skipped += 1;
      continue;
    }

    if (!APPLY) {
      console.log(
        `${tag} [dry-run] à traduire (EN détecté) — ` +
          `short: ${shortDescription ? `${shortDescription.length} car.` : "—"}, ` +
          `desc: ${description ? `${description.length} car.` : "—"}`
      );
      translated += 1;
      continue;
    }

    try {
      const out = await geminiTranslate(key as string, {
        name: p.name,
        description,
        shortDescription,
      });
      // Chaque champ fourni doit revenir traduit, sinon on ne touche à rien
      // (le produit sera retenté à la prochaine exécution).
      if ((description && !out.description) || (shortDescription && !out.shortDescription)) {
        throw new Error("traduction incomplète");
      }
      await db.product.update({
        where: { id: p.id },
        data: {
          // L'anglais d'origine (brut) est conservé dans les champs En —
          // stripShortcodes est appliqué à l'affichage par lib/catalog.
          descriptionEn: p.description,
          shortDescriptionEn: p.shortDescription,
          ...(out.description ? { description: out.description } : {}),
          ...(out.shortDescription ? { shortDescription: out.shortDescription } : {}),
        },
      });
      console.log(`${tag} ✓ traduit (FR écrit, EN archivé).`);
      translated += 1;
      await sleep(500); // courtoisie API
    } catch (e) {
      console.error(`${tag} ✗ échec :`, e instanceof Error ? e.message : e);
      failed += 1;
    }
  }

  console.log(
    `\nBilan : ${translated} ${APPLY ? "traduit(s)" : "à traduire"}, ` +
      `${skipped} ignoré(s), ${failed} échec(s).`
  );
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("Erreur fatale :", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
