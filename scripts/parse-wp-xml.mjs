import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = "G:/Mon Drive/additive/additive.WordPress.2026-06-13.xml";
const xml = readFileSync(SRC, "utf8");

const cdata = (s) => (s ?? "").replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? cdata(m[1]) : null;
};
const allMeta = (block) => {
  const out = {};
  const re = /<wp:postmeta>\s*<wp:meta_key>([\s\S]*?)<\/wp:meta_key>\s*<wp:meta_value>([\s\S]*?)<\/wp:meta_value>\s*<\/wp:postmeta>/g;
  let m;
  while ((m = re.exec(block))) out[cdata(m[1])] = cdata(m[2]);
  return out;
};
const cats = (block) => {
  const re = /<category domain="product_cat"[^>]*>([\s\S]*?)<\/category>/g;
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push(cdata(m[1]));
  return out;
};

const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

const attachments = new Map(); // postId -> { url, mime, title }
const glb = new Set();
const products = [];

for (const it of items) {
  const type = tag(it, "wp:post_type");
  const postId = tag(it, "wp:post_id");
  if (type === "attachment") {
    const url = tag(it, "wp:attachment_url");
    const mime = (it.match(/<wp:post_mime_type>([\s\S]*?)<\/wp:post_mime_type>/)?.[1] ?? "").trim();
    if (url) {
      attachments.set(postId, { url, mime: cdata(mime), title: tag(it, "title") });
      if (/\.(glb|gltf)(\?|$)/i.test(url)) glb.add(url);
    }
  }
}

for (const it of items) {
  const type = tag(it, "wp:post_type");
  if (type !== "product") continue;
  const status = tag(it, "wp:status");
  const meta = allMeta(it);
  const thumbId = meta["_thumbnail_id"];
  const galleryIds = (meta["_product_image_gallery"] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const imageUrls = [];
  if (thumbId && attachments.has(thumbId)) imageUrls.push(attachments.get(thumbId).url);
  for (const gid of galleryIds) if (attachments.has(gid)) imageUrls.push(attachments.get(gid).url);
  // GLB référencé dans le contenu / meta
  const blob = it + JSON.stringify(meta);
  const glbInProduct = [...blob.matchAll(/https?:\/\/[^\s"'<>]+\.(?:glb|gltf)/gi)].map((m) => m[0]);
  glbInProduct.forEach((u) => glb.add(u));

  products.push({
    title: tag(it, "title"),
    slug: tag(it, "wp:post_name"),
    status,
    sku: meta["_sku"] ?? null,
    price: meta["_price"] ?? meta["_regular_price"] ?? null,
    categories: cats(it),
    shortDescription: tag(it, "excerpt:encoded"),
    description: tag(it, "content:encoded"),
    images: [...new Set(imageUrls)],
    model3d: glbInProduct[0] ?? null,
  });
}

const published = products.filter((p) => p.status === "publish");
const out = {
  counts: {
    items: items.length,
    products: products.length,
    published: published.length,
    attachments: attachments.size,
    glb: glb.size,
  },
  glbUrls: [...glb],
  products,
};

mkdirSync("_source", { recursive: true });
writeFileSync("_source/wp-extract.json", JSON.stringify(out, null, 2));

console.log("Produits:", products.length, "| publiés:", published.length, "| médias:", attachments.size, "| 3D:", glb.size);
console.log("\nProduits publiés (titre | slug | prix | cats | nb images | 3D):");
for (const p of published) {
  console.log(` ${(p.title ?? "—").padEnd(16)} ${(p.slug ?? "").padEnd(16)} ${(p.price ?? "—").toString().padEnd(6)} [${p.categories.join(",")}] img:${p.images.length} ${p.model3d ? "3D✓" : ""}`);
}
console.log("\nExemples d'URLs 3D:");
[...glb].slice(0, 10).forEach((u) => console.log(" " + u));
