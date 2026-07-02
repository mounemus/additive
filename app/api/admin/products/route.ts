import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateCatalog } from "@/lib/admin";
import { productSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );

  const { images, collectionId, ...data } = parsed.data;
  try {
    const created = await db.product.create({
      data: {
        ...data,
        price: data.price ?? null,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        dimensions: data.dimensions || null,
        model3dUrl: data.model3dUrl || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        collectionId: collectionId || null,
        images: {
          create: images.map((img, i) => ({
            url: img.url,
            alt: img.alt || null,
            order: i,
          })),
        },
      },
    });
    revalidateCatalog();
    logAudit("create", "Product", created.id, created.name);
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error("[admin/products] create error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
