import { getProvidersStatus, getPricingConfig } from "@/lib/configurator-settings";
import { SystemHealth } from "@/components/admin/system-health";
import { AiProvidersForm } from "@/components/admin/ai-providers-form";
import { PricingForm } from "@/components/admin/pricing-form";
import { ContentEditor } from "@/components/admin/content-editor";
import { getConsentText } from "@/lib/configurator-settings";
import { getModulairConfig } from "@/lib/modulair-settings";
import { ModulairConfigForm } from "@/components/admin/modulair-config-form";

export const dynamic = "force-dynamic";

export default async function AdminConfiguratorPage() {
  const [providers, pricing, consent, modulair] = await Promise.all([
    getProvidersStatus(),
    getPricingConfig(),
    getConsentText(),
    getModulairConfig(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurateur « Créer ma monture »</h1>
        <p className="mt-1 text-sm text-muted">
          Fournisseurs IA, grille tarifaire, texte de consentement et santé du système.
        </p>
      </div>

      <SystemHealth />

      <div className="grid gap-6 xl:grid-cols-2">
        <AiProvidersForm initial={providers} />
        <PricingForm initial={pricing} />
      </div>

      <ModulairConfigForm initial={modulair} />

      <ContentEditor
        contentKey="configurator.consent"
        title="Texte de consentement"
        description="Affiché à l'étape 1 du configurateur, avant toute capture d'image."
        value={consent}
      />
    </div>
  );
}
