import { getContent } from "@/lib/catalog";
import { ThemeEditor, MediaEditor } from "@/components/admin/theme-media-editor";
import type { SiteTheme, SiteMedia } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function AdminAppearancePage() {
  const [theme, media] = await Promise.all([
    getContent<Partial<SiteTheme>>("theme"),
    getContent<Partial<SiteMedia>>("media"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Apparence &amp; Médias</h1>
        <p className="mt-1 text-sm text-muted">
          Pilotez la charte couleur et les sources média (vidéos, images, modèle
          3D) du site — sans toucher au code.
        </p>
      </div>
      <div className="grid max-w-5xl gap-6 lg:grid-cols-2 lg:items-start">
        <ThemeEditor value={theme ?? {}} />
        <MediaEditor value={media ?? {}} />
      </div>
    </div>
  );
}
