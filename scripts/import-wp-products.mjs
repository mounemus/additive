/**
 * Importe les produits récupérés de l'export WordPress (_source/wp-extract.json)
 * dans la base : images réelles (buypukka.ca), descriptions, prix, collection,
 * et modèle 3D GLB quand un fichier correspond.
 *   node scripts/import-wp-products.mjs   (nécessite DATABASE_URL)
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const data = JSON.parse(readFileSync("_source/wp-extract.json", "utf8"));

const stripHtml = (s) =>
  (s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&#039;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();

// Catégorie WordPress → slug de collection.
function collectionSlug(cats) {
  const c = (cats ?? []).map((x) => x.toLowerCase());
  if (c.some((x) => ["modul'air", "modul’air", "eclipso", "cyborg", "cygnus"].includes(x))) return "modulair";
  if (c.some((x) => x.includes("generative"))) return "generative";
  if (c.some((x) => x.includes("hybride"))) return "hybride";
  return null;
}

const COLORS = ["Black", "White", "Blue", "Red", "Orange"];
const MATERIALS = ["Nylon PA12 (impression SLS)", "Verres personnalisables"];

const glbUrls = data.glbUrls ?? [];
function findGlb(slug, cats) {
  const keys = [slug, ...(cats ?? [])].map((s) => (s ?? "").toLowerCase());
  return (
    glbUrls.find((u) => keys.some((k) => k && u.toLowerCase().includes(k))) ?? null
  );
}

async function main() {
  const cols = await db.collection.findMany({ select: { id: true, slug: true } });
  const colId = new Map(cols.map((c) => [c.slug, c.id]));

  let created = 0,
    updated = 0,
    skipped = 0;

  for (const p of data.products) {
    if (!p.slug || p.status !== "publish") {
      skipped++;
      continue;
    }
    const cslug = collectionSlug(p.categories);
    // On ignore le produit Woo dynamique « Lunettes personnalisées ».
    if (!cslug || /lunettes-personnalisees/.test(p.slug)) {
      skipped++;
      continue;
    }
    const images = (p.images ?? []).filter(Boolean);
    const model3d = p.model3d ?? findGlb(p.slug, p.categories);
    const priceNum = p.price ? Number(p.price) : 250;

    const fields = {
      name: stripHtml(p.title) || p.slug,
      shortDescription: stripHtml(p.shortDescription).slice(0, 480) || null,
      description: stripHtml(p.description).slice(0, 8000) || null,
      price: Number.isFinite(priceNum) ? priceNum : 250,
      colors: COLORS,
      materials: MATERIALS,
      model3dUrl: model3d,
      collectionId: colId.get(cslug) ?? null,
      isPublished: true,
    };

    const existing = await db.product.findUnique({ where: { slug: p.slug } });
    const product = existing
      ? await db.product.update({ where: { slug: p.slug }, data: fields })
      : await db.product.create({ data: { slug: p.slug, isFeatured: false, ...fields } });
    existing ? updated++ : created++;

    if (images.length) {
      await db.productImage.deleteMany({ where: { productId: product.id } });
      await db.productImage.createMany({
        data: images.slice(0, 10).map((url, i) => ({ productId: product.id, url, alt: fields.name, order: i })),
      });
    }
    console.log(`${existing ? "↑" : "+"} ${fields.name.padEnd(16)} ${cslug.padEnd(10)} img:${images.length} ${model3d ? "3D" : ""}`);
  }

  console.log(`\n✓ Import : ${created} créés, ${updated} mis à jour, ${skipped} ignorés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
