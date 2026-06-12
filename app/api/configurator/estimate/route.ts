import { NextResponse } from "next/server";
import { computeEstimate } from "@/lib/configurator";
import { estimateSchema } from "@/lib/validations";

/**
 * Estimation de prix du configurateur.
 * Toujours calculée ici, côté serveur — le client n'affiche jamais
 * un total qu'il aurait calculé lui-même.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = estimateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  return NextResponse.json(computeEstimate(parsed.data));
}
