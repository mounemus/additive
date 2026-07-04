import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/** Taille maximale acceptée : 100 Mo (vidéos, GLB…). */
const MAX_SIZE_BYTES = 100 * 1024 * 1024;

/** Types MIME autorisés pour l'upload direct vers Vercel Blob. */
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "model/gltf-binary",
];

/**
 * Upload client direct vers Vercel Blob (contourne la limite 4,5 Mo des
 * fonctions serverless). Le client appelle `upload()` de @vercel/blob/client
 * avec `handleUploadUrl` pointant ici ; cette route génère un token signé,
 * protégé par requireAdmin().
 *
 * NB : `onUploadCompleted` n'est pas invoqué en localhost (Blob ne peut pas
 * rappeler le serveur local) — la création du MediaAsset est donc faite côté
 * client après succès, via POST /api/admin/media.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await requireAdmin();
        if (!session) {
          throw new Error("unauthorized");
        }

        // Les fichiers .glb arrivent souvent en application/octet-stream :
        // on ne l'autorise QUE si le nom de fichier se termine par .glb.
        const isGlb = /\.glb$/i.test(pathname);
        const allowedContentTypes = isGlb
          ? [...ALLOWED_CONTENT_TYPES, "application/octet-stream"]
          : ALLOWED_CONTENT_TYPES;

        return {
          allowedContentTypes,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No-op : jamais appelé en localhost (Blob ne peut pas rappeler le
        // serveur local). L'audit "upload" est journalisé dans
        // POST /api/admin/media lors de la création du MediaAsset.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_error";
    if (message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[admin/media/upload] error:", e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
