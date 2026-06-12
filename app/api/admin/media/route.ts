import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { mediaSchema } from "@/lib/validations";

export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = mediaSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );

  try {
    const created = await db.mediaAsset.create({
      data: {
        url: parsed.data.url,
        alt: parsed.data.alt || null,
        kind: parsed.data.kind,
      },
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error("[admin/media] create error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
