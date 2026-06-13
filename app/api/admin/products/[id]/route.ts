import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  // Bascule rapide publier/dépublier ou vedette depuis la liste.
  if (
    typeof body === "object" &&
    body !== null &&
    Object.keys(body).every((k) => ["isPublished", "isFeatured"].includes(k))
  ) {
    try {
      await db.product.update({ where: { id: params.id }, data: body });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );

  const { images, collectionId, ...data } = parsed.data;
  try {
    await db.product.update({
      where: { id: params.id },
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
          deleteMany: {},
          create: images.map((img, i) => ({
            url: img.url,
            alt: img.alt || null,
            order: i,
          })),
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/products] update error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await db.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
