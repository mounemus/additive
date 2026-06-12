import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const contentSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
});

export async function PUT(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = contentSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation" }, { status: 422 });

  try {
    await db.siteContent.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value as object },
      create: { key: parsed.data.key, value: parsed.data.value as object },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/content] upsert error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
