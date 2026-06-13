import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const row = await db.siteContent.findUnique({ where: { key: "configurator.providers" } });
const v = row?.value ?? {};
console.log("imageProvider:", v.imageProvider);
console.log("imageModel:", v.imageModel);
console.log("visionProvider:", v.visionProvider);
console.log("keys set:", Object.keys(v.keys ?? {}).map((k) => `${k}=${(v.keys[k] || "").slice(0, 3)}…`));
await db.$disconnect();
