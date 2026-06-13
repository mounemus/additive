import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const row = await db.siteContent.findUnique({ where: { key: "configurator.providers" } });
const key = row?.value?.keys?.gemini;
if (!key) { console.log("Pas de clé Gemini en base"); process.exit(0); }

const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`);
const data = await res.json();
const names = (data.models ?? []).map((m) => m.name.replace("models/", ""));
const wanted = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];
console.log("HTTP", res.status);
for (const w of wanted) console.log((names.includes(w) ? "✓" : "✗"), w);
console.log("\nTous les modèles image disponibles :");
console.log(names.filter((n) => n.includes("image")).join("\n"));
await db.$disconnect();
