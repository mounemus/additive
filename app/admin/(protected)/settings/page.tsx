import { getContent } from "@/lib/catalog";
import { ContentEditor } from "@/components/admin/content-editor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getContent<unknown>("settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">
          Identité du site, contact, réseaux sociaux, devise et SEO global.
        </p>
      </div>
      <div className="max-w-3xl">
        <ContentEditor
          contentKey="settings"
          title="Paramètres généraux"
          description="Nom du site, email de contact, localisation, devise, Instagram et métadonnées SEO par défaut."
          value={settings}
        />
      </div>
    </div>
  );
}
