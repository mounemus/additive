import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customizationRequestSchema } from "@/lib/validations";
import { computeEstimate } from "@/lib/configurator";
import { estimateSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = customizationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Le prix est TOUJOURS recalculé côté serveur à partir des options brutes —
  // jamais accepté tel quel depuis le client (principe hérité du plugin).
  let estimatedPrice: number | null = null;
  const estimateInput = estimateSchema.safeParse({
    conceptLabel: parsed.data.conceptLabel,
    boldness: parsed.data.boldness,
    lensType: parsed.data.options?.lensType,
    finish: parsed.data.options?.finish,
  });
  if (estimateInput.success) {
    estimatedPrice = computeEstimate(estimateInput.data).total;
  }

  try {
    const created = await db.customizationRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        faceShape: parsed.data.faceShape ?? null,
        styleTags: parsed.data.styleTags,
        boldness: parsed.data.boldness ?? null,
        conceptLabel: parsed.data.conceptLabel ?? null,
        conceptSummary: parsed.data.conceptSummary ?? null,
        options: parsed.data.options ?? undefined,
        estimatedPrice,
        message: parsed.data.message || null,
      },
    });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    console.error("[customization] persistence error:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
