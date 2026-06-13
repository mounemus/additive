import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customizationRequestSchema, quoteOptionsSchema } from "@/lib/validations";
import { computeQuote } from "@/lib/configurator";
import { getPricingConfig } from "@/lib/configurator-settings";

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
  const optionInput = quoteOptionsSchema.safeParse({
    conceptLabel: parsed.data.conceptLabel,
    boldness: parsed.data.boldness,
    ...(parsed.data.options ?? {}),
  });
  if (optionInput.success) {
    const pricing = await getPricingConfig();
    estimatedPrice = computeQuote(optionInput.data, pricing).total;
  }

  try {
    const created = await db.customizationRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        faceShape: parsed.data.faceShape ?? null,
        measurements: (parsed.data.measurements as object) ?? undefined,
        analysisReport: (parsed.data.analysisReport as object) ?? undefined,
        styleTags: parsed.data.styleTags,
        boldness: parsed.data.boldness ?? null,
        conceptLabel: parsed.data.conceptLabel ?? null,
        conceptSummary: parsed.data.conceptSummary ?? null,
        conceptData: (parsed.data.conceptData as object) ?? undefined,
        matchRate: parsed.data.matchRate ?? null,
        moodboardUrl: parsed.data.moodboardUrl ?? null,
        options: (parsed.data.options as object) ?? undefined,
        estimatedPrice,
        photoToken: parsed.data.photoToken ?? null,
        message: parsed.data.message || null,
      },
    });
    return NextResponse.json({ ok: true, id: created.id, estimatedPrice }, { status: 201 });
  } catch (e) {
    console.error("[customization] persistence error:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
