/**
 * Génère un visuel IA par collection et le pose comme image de collection.
 *   node scripts/generate-collections.mjs   (clé Gemini en base)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const row = await db.siteContent.findUnique({ where: { key: "configurator.providers" } });
const key = row?.value?.keys?.gemini || process.env.GEMINI_API_KEY;
if (!key) { console.error("Pas de clé Gemini"); process.exit(1); }

const MODEL = "gemini-3-pro-image";
const OUT = "public/images/editorial";
mkdirSync(OUT, { recursive: true });
const NO = "Aucun texte, aucun logo, aucune marque, aucun visage. Format horizontal large, cinématique.";

const COLLECTIONS = [
  { slug: "modulair", prompt: `Vue éclatée cinématique des composants d'une monture de lunettes modulaire imprimée en 3D, flottant dans l'espace (face avant, deux branches, charnières, verres) sur fond gris anthracite dégradé, lumière studio nette, esthétique design industriel premium. ${NO}` },
  { slug: "generative", prompt: `Monture de lunettes sculpturale et générative, géométrie paramétrique complexe, maillage filaire organique, fond noir profond avec accents bleu électrique #1557ff, design computationnel élégant et futuriste. ${NO}` },
  { slug: "hybride", prompt: `Monture de lunettes premium mêlant nylon PA12 imprimé en 3D mat et finitions de matières contrastées, gros plan tactile sur fond minéral chaud beige, lumière douce, ambiance artisanat numérique haut de gamme. ${NO}` },
];

async function gen(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
  });
  if (!res.ok) { console.error("HTTP", res.status); return null; }
  const data = await res.json();
  for (const p of data?.candidates?.[0]?.content?.parts ?? []) {
    const inline = p.inline_data ?? p.inlineData;
    if (inline?.data) return inline.data;
  }
  return null;
}

for (const c of COLLECTIONS) {
  process.stdout.write(`→ ${c.slug}… `);
  const b64 = await gen(c.prompt);
  if (b64) {
    const file = `collection-${c.slug}.png`;
    writeFileSync(`${OUT}/${file}`, Buffer.from(b64, "base64"));
    await db.collection.updateMany({ where: { slug: c.slug }, data: { image: `/images/editorial/${file}` } });
    console.log("ok + collection.image mise à jour");
  } else console.log("échec");
}
await db.$disconnect();
console.log("✓ Terminé.");
