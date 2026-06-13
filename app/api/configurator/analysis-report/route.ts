import { NextResponse } from "next/server";
import { analysisReportSchema } from "@/lib/validations";
import { chasseRecommendation, type FaceMeasurements } from "@/lib/face/face-analysis";
import { FACE_SHAPES, MORPHOLOGY_RULES, type FaceShape } from "@/lib/configurator";

/**
 * Construit un rapport d'analyse + recommandations de chausse à partir des
 * mesures (calculées dans le navigateur). Aucune image n'est reçue ici :
 * seules les mesures millimétriques anonymes transitent.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = analysisReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 422 });
  }

  const m = parsed.data.measurements as unknown as FaceMeasurements;
  const shape = (parsed.data.faceShape as FaceShape) ?? "ovale";
  const shapeInfo = FACE_SHAPES.find((s) => s.id === shape);
  const rules = MORPHOLOGY_RULES[shape] ?? MORPHOLOGY_RULES.ovale;
  const chasse = chasseRecommendation(m);

  return NextResponse.json({
    faceShape: shape,
    faceShapeLabel: shapeInfo?.label ?? "Ovale",
    recommendation: shapeInfo?.recommendation ?? "",
    advise: rules.advise,
    avoid: rules.avoid,
    chasse,
  });
}
