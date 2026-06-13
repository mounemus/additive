import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { pricingAdminSchema } from "@/lib/validations";
import { savePricingConfig } from "@/lib/configurator-settings";

export async function PUT(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = pricingAdminSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 422 }
    );

  try {
    await savePricingConfig(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/pricing] save error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
