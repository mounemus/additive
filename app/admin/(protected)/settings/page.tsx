import { getContent } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ContentEditor } from "@/components/admin/content-editor";
import { TotpSetup } from "@/components/admin/totp-setup";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getContent<unknown>("settings");

  // État 2FA de l'admin connecté (secret jamais exposé, juste le booléen).
  const session = await auth();
  const email = session?.user?.email;
  const admin = email
    ? await db.adminUser.findUnique({
        where: { email },
        select: { totpEnabled: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="mt-1 text-sm text-muted">
          Identité du site, contact, réseaux sociaux, devise et SEO global.
        </p>
      </div>
      <div className="max-w-3xl space-y-6">
        <ContentEditor
          contentKey="settings"
          title="Paramètres généraux"
          description="Nom du site, email de contact, localisation, devise, Instagram et métadonnées SEO par défaut."
          value={settings}
        />
        <TotpSetup enabled={admin?.totpEnabled ?? false} />
      </div>
    </div>
  );
}
