/**
 * Génère des visuels éditoriaux premium via Gemini (Nano Banana Pro) et les
 * enregistre dans public/images/editorial/ (hébergés dans le repo).
 *   node scripts/generate-editorial.mjs   (clé Gemini lue en base)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const row = await db.siteContent.findUnique({ where: { key: "configurator.providers" } });
const key = row?.value?.keys?.gemini || process.env.GEMINI_API_KEY;
await db.$disconnect();
if (!key) { console.error("Pas de clé Gemini"); process.exit(1); }

const MODEL = "gemini-3-pro-image";
const OUT = "public/images/editorial";
mkdirSync(OUT, { recursive: true });

const NO = "Aucun texte, aucun logo, aucune marque, aucun visage reconnaissable.";
const IMAGES = [
  { name: "hero-frame", prompt: `Photographie produit cinématique d'une monture de lunettes sculpturale imprimée en 3D en nylon PA12 mat, posée sur une surface minérale sombre, éclairage studio dramatique latéral, arrière-plan gris anthracite profond dégradé, ambiance premium et technologique, macro nette. ${NO}` },
  { name: "macro-pa12", prompt: `Macro extrême de la surface en nylon PA12 fritté (SLS) d'une lunette : micro-texture granuleuse, structure lattice paramétrique ajourée, lumière rasante qui révèle le relief, tons graphite et écru. Abstrait, tactile, haut de gamme. ${NO}` },
  { name: "exploded-modulair", prompt: `Vue éclatée flottante des composants modulaires d'une monture de lunettes imprimée en 3D : face avant, deux branches, charnières, verres, qui se séparent dans l'espace, fond clair neutre studio, ombres douces, esthétique design industriel épuré. ${NO}` },
  { name: "generative-form", prompt: `Sculpture abstraite générative inspirée d'une monture de lunettes : lignes paramétriques continues, maillage filaire bleu électrique (#1557ff) sur fond noir profond, esthétique de design computationnel, élégant et minimal. ${NO}` },
  { name: "matter-band", prompt: `Composition éditoriale horizontale : plusieurs échantillons de montures imprimées en 3D en nylon PA12 dans des teintes noir, écru, bleu et orange, disposés en grille sur un fond papier clair, lumière naturelle douce, façon magazine de design. ${NO}` },
];

async function gen(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
  });
  if (!res.ok) { console.error("HTTP", res.status, (await res.text()).slice(0, 200)); return null; }
  const data = await res.json();
  for (const p of data?.candidates?.[0]?.content?.parts ?? []) {
    const inline = p.inline_data ?? p.inlineData;
    if (inline?.data) return inline.data;
  }
  return null;
}

for (const img of IMAGES) {
  process.stdout.write(`→ ${img.name}… `);
  try {
    const b64 = await gen(img.prompt);
    if (b64) {
      writeFileSync(`${OUT}/${img.name}.png`, Buffer.from(b64, "base64"));
      console.log("ok");
    } else console.log("échec (pas d'image)");
  } catch (e) {
    console.log("erreur", e.message);
  }
}
console.log("✓ Terminé.");
