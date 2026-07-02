import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Nettoyage quotidien (Vercel Cron, voir vercel.json) :
 *  - photos temporaires expirées (confidentialité),
 *  - fenêtres de rate-limit passées,
 *  - images générées dont le cache a expiré,
 *  - journaux d'appels IA de plus de 90 jours.
 *
 * Si CRON_SECRET est défini dans l'environnement, Vercel l'envoie en
 * Authorization — on l'exige alors. La route ne fait que supprimer des
 * lignes déjà expirées : inoffensive même appelée à la main.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const logCutoff = new Date(Date.now() - 90 * 24 * 3600_000);

  try {
    const [photos, windows, images, logs] = await Promise.all([
      db.tempPhoto.deleteMany({ where: { expiresAt: { lt: now } } }),
      db.rateLimitWindow.deleteMany({ where: { resetAt: { lt: now } } }),
      db.generatedImage.deleteMany({ where: { expiresAt: { lt: now } } }),
      db.aiCallLog.deleteMany({ where: { createdAt: { lt: logCutoff } } }),
    ]);
    return NextResponse.json({
      ok: true,
      purged: {
        tempPhotos: photos.count,
        rateLimitWindows: windows.count,
        generatedImages: images.count,
        aiCallLogs: logs.count,
      },
    });
  } catch (e) {
    console.error("[cron/cleanup] erreur:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
