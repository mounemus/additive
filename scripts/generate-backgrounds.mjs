/**
 * Génère des ARRIÈRE-PLANS « fade neutre » premium via Gemini (Nano Banana Pro)
 * pour habiller les sections sombres sans voler la vedette au texte.
 * Sortie : public/images/bg/*.png (hébergés dans le repo).
 *
 *   node scripts/generate-backgrounds.mjs
 *   (clé Gemini lue dans la base — clé SiteContent "configurator.providers" —
 *    sinon variable d'env GEMINI_API_KEY ; DATABASE_URL requis pour la base.)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

let key = process.env.GEMINI_API_KEY;
try {
  const db = new PrismaClient();
  const row = await db.siteContent.findUnique({ where: { key: "configurator.providers" } });
  key = row?.value?.keys?.gemini || key;
  await db.$disconnect();
} catch {
  /* pas de base en local → on retombe sur GEMINI_API_KEY */
}
if (!key) {
  console.error("Pas de clé Gemini (ni en base, ni GEMINI_API_KEY).");
  process.exit(1);
}

const MODEL = "gemini-3-pro-image";
const OUT = "public/images/bg";
mkdirSync(OUT, { recursive: true });

const NO =
  "Aucun texte, aucun logo, aucune marque, aucun visage. Très faible contraste, sombre, neutre, abstrait, espace négatif central pour superposer du texte clair. Format paysage 16:9.";

const IMAGES = [
  {
    name: "tech-neutral",
    prompt: `Arrière-plan abstrait haut de gamme : nappe de poudre de nylon gris graphite très sombre, micro-grain SLS, structure lattice paramétrique à peine visible dans les coins, dégradé doux du noir profond (#0b0d10) vers l'anthracite, éclairage rasant subtil. Ambiance laboratoire de fabrication additive, calme et minéral. ${NO}`,
  },
  {
    name: "cta-neutral",
    prompt: `Arrière-plan cinématique très sombre : volute de lumière froide bleu électrique (#1557ff) extrêmement diffuse et désaturée sur fond noir profond, fines particules en suspension, profondeur atmosphérique, grand vide sombre au centre. Élégant, technologique, discret. ${NO}`,
  },
  {
    name: "matter-neutral",
    prompt: `Arrière-plan texture matière : surface en nylon PA12 fritté mate, relief granuleux en lumière rasante, tons graphite et écru désaturés, dégradé sombre uniforme, aspect tactile et premium. ${NO}`,
  },
];

async function gen(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    }
  );
  if (!res.ok) {
    console.error("HTTP", res.status, (await res.text()).slice(0, 200));
    return null;
  }
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
console.log("✓ Terminé. → public/images/bg/");
