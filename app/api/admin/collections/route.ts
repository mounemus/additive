import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { collectionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = collectionSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );

  try {
    const created = await db.collection.create({
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
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error("[admin/collections] create error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
