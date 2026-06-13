import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getProvidersStatus } from "@/lib/configurator-settings";

/** Santé du système : base de données, providers IA, file des demandes. */
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let dbOk = false;
  let pendingRequests = 0;
  let tempPhotos = 0;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    pendingRequests = await db.customizationRequest.count({ where: { status: "new" } });
    tempPhotos = await db.tempPhoto.count();
  } catch {
    dbOk = false;
  }

  const status = await getProvidersStatus();
  const moodboardProvider = status.tasks?.moodboard?.provider ?? "demo";
  const imageConfigured = status.providers.some(
    (p) => p.slot === "image" && p.id === moodboardProvider && p.configured
  );

  return NextResponse.json({
    database: dbOk,
    imageGeneration: imageConfigured,
    activeImageProvider: moodboardProvider,
    pendingRequests,
    tempPhotos,
    timestamp: new Date().toISOString(),
  });
}
