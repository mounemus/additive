import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin";
import { MediaManager } from "@/components/admin/media-manager";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const assets = await safeQuery(
    () => db.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }),
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Médias</h1>
        <p className="mt-1 text-sm text-muted">
          Images produits, vidéos, rendus 3D, textures et moodboards.
        </p>
      </div>
      <MediaManager assets={assets} />
    </div>
  );
}
