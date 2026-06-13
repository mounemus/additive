import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { modulairConfigSchema } from "@/lib/validations";
import { saveModulairConfig } from "@/lib/modulair-settings";
import type { ModulairConfig } from "@/lib/modulair";

export async function PUT(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = modulairConfigSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });

  try {
    await saveModulairConfig(parsed.data as ModulairConfig);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/modulair] save error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
