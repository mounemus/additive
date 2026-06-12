/**
 * Seed ADDITIVE — `npm run db:seed`
 * Crée : 3 collections, 14 produits (catalogue WordPress migré),
 * contenus éditoriaux (hero, manifeste, technologie, FAQ, réglages)
 * et le compte admin (ADMIN_EMAIL / ADMIN_PASSWORD du .env).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COLLECTIONS, PRODUCTS, SITE_CONTENT } from "../content/static-data";

const db = new PrismaClient();

async function main() {
  console.log("→ Seed des collections…");
  const collectionIds = new Map<string, string>();
  for (const c of COLLECTIONS) {
    const row = await db.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        image: c.image,
        order: c.order,
        isPublished: true,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
      },
      create: {
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        image: c.image,
        order: c.order,
        isPublished: true,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
      },
    });
    collectionIds.set(c.slug, row.id);
  }

  console.log("→ Seed des produits…");
  for (const p of PRODUCTS) {
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        collectionId: collectionIds.get(p.collectionSlug),
        colors: p.colors,
        materials: p.materials,
        dimensions: p.dimensions,
        features: p.features,
        isFeatured: p.isFeatured,
        isPublished: p.isPublished,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      },
      create: {
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        collectionId: collectionIds.get(p.collectionSlug),
        colors: p.colors,
        materials: p.materials,
        dimensions: p.dimensions,
        features: p.features,
        isFeatured: p.isFeatured,
        isPublished: p.isPublished,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      },
    });
    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.create({
      data: { productId: product.id, url: p.image, alt: p.name, order: 0 },
    });
  }

  console.log("→ Seed des contenus éditoriaux…");
  for (const [key, value] of Object.entries(SITE_CONTENT)) {
    await db.siteContent.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });
  }

  console.log("→ Seed du compte admin…");
  const email = (process.env.ADMIN_EMAIL ?? "admin@additive.ca").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "additive2026";
  const hash = await bcrypt.hash(password, 12);
  await db.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, name: "Admin ADDITIVE", password: hash, role: "admin" },
  });

  console.log("✓ Seed terminé.");
  console.log(`  Admin : ${email} (mot de passe défini dans .env)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
