import "server-only";
import sharp from "sharp";

/**
 * Assainit une photo reçue en data URL :
 *  1. décodage strict + vérification des MAGIC BYTES (JPEG/PNG/WebP réels —
 *     un fichier renommé ou un payload arbitraire est rejeté) ;
 *  2. orientation EXIF appliquée, redimensionnement dans 1024×1024 ;
 *  3. réencodage JPEG (métadonnées EXIF supprimées au passage).
 *
 * Bénéfices : la base ne stocke plus 8 Mo par photo, les payloads envoyés aux
 * fournisseurs d'IA restent loin de la limite Vercel, et rien d'autre qu'une
 * vraie image n'entre dans le pipeline.
 *
 * @returns data URL JPEG assainie, ou null si l'entrée n'est pas une image valide.
 */
export async function sanitizePhotoDataUrl(
  dataUrl: string,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<string | null> {
  const { maxDim = 1024, quality = 82 } = opts;

  const m = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return null;

  let buf: Buffer;
  try {
    buf = Buffer.from(m[2], "base64");
  } catch {
    return null;
  }
  if (buf.length < 64 || buf.length > 12_000_000) return null;

  // Magic bytes réels (le MIME déclaré ne fait pas foi).
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isWebp =
    buf.length > 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) return null;

  try {
    const out = await sharp(buf, { limitInputPixels: 40_000_000 })
      .rotate() // applique l'orientation EXIF
      .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch (e) {
    console.error("[image-sanitize] image invalide:", e);
    return null;
  }
}
