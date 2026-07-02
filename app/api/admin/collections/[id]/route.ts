import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidateCatalog } from "@/lib/admin";
import { collectionSchema } from "@/lib/validations";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  if (
    typeof body === "object" &&
    body !== null &&
    Object.keys(body).every((k) => ["isPublished", "order"].includes(k))
  ) {
    try {
      await db.collection.update({ where: { id: params.id }, data: body });
      revalidateCatalog();
    return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  const parsed = collectionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );

  try {
    await db.collection.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        tagline: parsed.data.tagline || null,
        description: parsed.data.description || null,
        image: parsed.data.image || null,
        video: parsed.data.video || null,
        seoTitle: parsed.data.seoTitle || null,
        seoDescription: parsed.data.seoDescription || null,
      },
    });
    revalidateCatalog();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/collections] update error:", e);
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
    await db.collection.delete({ where: { id: params.id } });
    revalidateCatalog();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
