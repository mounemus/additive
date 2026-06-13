import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Combinaison optimale (recherche nov. 2025–juin 2026) :
//  - Nano Banana 2 (rapide) pour le moodboard ;
//  - Nano Banana Pro (édition fidèle + image de référence) pour concepts,
//    façade d'essayage et portrait porté (identité préservée).
const tasks = {
  moodboard: { provider: "gemini", model: "gemini-3.1-flash-image" },
  concepts: { provider: "gemini", model: "gemini-3-pro-image" },
  frameOverlay: { provider: "gemini", model: "gemini-3-pro-image" },
  portrait: { provider: "gemini", model: "gemini-3-pro-image" },
};

const row = await db.siteContent.findUnique({ where: { key: "configurator.providers" } });
const current = row?.value ?? {};
const next = {
  tasks,
  visionProvider: current.visionProvider ?? "demo",
  keys: current.keys ?? {},
};
await db.siteContent.upsert({
  where: { key: "configurator.providers" },
  update: { value: next },
  create: { key: "configurator.providers", value: next },
});
console.log("Config IA optimale appliquée :");
for (const [k, v] of Object.entries(tasks)) console.log(` ${k.padEnd(13)} → ${v.provider} / ${v.model}`);
await db.$disconnect();
