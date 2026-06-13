import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const value = {
  eyebrow: "ADDITIVE EYEWEAR — Montréal",
  title: "Lunettes imprimées en 3D. Conçues autour de vous.",
  subtitle:
    "Des montures légères, modulaires et personnalisables, créées à Montréal et fabriquées à la demande.",
  ctaPrimary: "Créer mes lunettes",
  ctaSecondary: "Explorer les collections",
};
await db.siteContent.upsert({ where: { key: "hero" }, update: { value }, create: { key: "hero", value } });
console.log("✓ Hero mis à jour :", value.title);
await db.$disconnect();
