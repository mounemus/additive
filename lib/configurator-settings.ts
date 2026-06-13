import "server-only";
import { db } from "@/lib/db";
import {
  DEFAULT_PRICING,
  DEFAULT_PROVIDERS,
  DEFAULT_CONSENT_TEXT,
  PROVIDER_CATALOG,
  type PricingConfig,
  type ProvidersConfig,
  type TaskAssignment,
  type ImageTask,
} from "@/content/configurator-defaults";

/**
 * Accès serveur aux réglages du configurateur (SiteContent).
 *
 * RÈGLE NON NÉGOCIABLE : les clés de fournisseurs IA ne sont JAMAIS
 * renvoyées au client. Les fonctions "public" exposent uniquement des
 * libellés, des prix d'options, des affectations de tâche et des statuts.
 */

const KEY_PRICING = "configurator.pricing";
const KEY_PROVIDERS = "configurator.providers"; // contient des secrets
const KEY_CONSENT = "configurator.consent";

async function readContent<T>(key: string, fallback: T): Promise<T> {
  try {
    const row = await db.siteContent.findUnique({ where: { key } });
    if (row) return { ...fallback, ...(row.value as object) } as T;
  } catch {
    // base absente → repli défauts
  }
  return fallback;
}

export async function getPricingConfig(): Promise<PricingConfig> {
  return readContent<PricingConfig>(KEY_PRICING, DEFAULT_PRICING);
}

export async function getConsentText() {
  return readContent(KEY_CONSENT, DEFAULT_CONSENT_TEXT);
}

/** Config complète des providers — SERVEUR UNIQUEMENT (contient les clés). */
export async function getProvidersConfig(): Promise<ProvidersConfig> {
  return readContent<ProvidersConfig>(KEY_PROVIDERS, DEFAULT_PROVIDERS);
}

/**
 * Affectation (fournisseur + modèle) résolue pour une tâche, avec repli sur la
 * config héritée `imageProvider` quand la tâche n'a pas d'override explicite.
 * Évite de casser une config existante qui ne déclarait qu'`imageProvider`.
 */
export async function getTaskConfig(task: ImageTask): Promise<TaskAssignment> {
  const cfg = await getProvidersConfig();
  const t = cfg.tasks?.[task];
  if (t?.provider && t.provider !== "demo") return { provider: t.provider, model: t.model };
  if (cfg.imageProvider && cfg.imageProvider !== "demo") {
    return { provider: cfg.imageProvider, model: cfg.imageModel ?? t?.model ?? "gpt-image-1" };
  }
  return { provider: t?.provider ?? "demo", model: t?.model ?? "gpt-image-1" };
}

/** Récupère une clé : config admin d'abord, variable d'environnement sinon. */
export async function getProviderKey(providerId: string): Promise<string | null> {
  const cfg = await getProvidersConfig();
  const fromAdmin = cfg.keys?.[providerId];
  if (fromAdmin && fromAdmin.trim()) return fromAdmin.trim();
  const entry = PROVIDER_CATALOG.find((p) => p.id === providerId);
  const fromEnv = entry ? process.env[entry.keyEnv] : undefined;
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : null;
}

/** Vue SÛRE pour l'admin : statut des clés + affectations par tâche. */
export async function getProvidersStatus() {
  const cfg = await getProvidersConfig();
  const providers = PROVIDER_CATALOG.map((p) => {
    const key = cfg.keys?.[p.id] || process.env[p.keyEnv] || "";
    return {
      id: p.id,
      label: p.label,
      slot: p.slot,
      models: p.models,
      keyEnv: p.keyEnv,
      configured: Boolean(key && key.trim()),
      masked: key ? `${"•".repeat(Math.max(0, key.length - 4))}${key.slice(-4)}` : "",
    };
  });
  // Affectations résolues (avec repli hérité).
  const tasks: Record<string, TaskAssignment> = {};
  for (const t of ["moodboard", "concepts", "frameOverlay", "portrait"] as ImageTask[]) {
    tasks[t] = await getTaskConfig(t);
  }
  return { tasks, visionProvider: cfg.visionProvider, providers };
}

/** Indique au client si la génération IA est active (sans révéler de provider). */
export async function isImageGenerationActive(): Promise<boolean> {
  const t = await getTaskConfig("moodboard");
  if (t.provider === "demo") return false;
  return Boolean(await getProviderKey(t.provider));
}

export async function savePricingConfig(value: PricingConfig) {
  await db.siteContent.upsert({
    where: { key: KEY_PRICING },
    update: { value: value as object },
    create: { key: KEY_PRICING, value: value as object },
  });
}

export async function saveConsentText(value: unknown) {
  await db.siteContent.upsert({
    where: { key: KEY_CONSENT },
    update: { value: value as object },
    create: { key: KEY_CONSENT, value: value as object },
  });
}

export async function saveProvidersConfig(partial: Partial<ProvidersConfig>) {
  const current = await getProvidersConfig();
  // Fusion des clés : une clé vide n'écrase pas une clé existante.
  const keys = { ...current.keys };
  if (partial.keys) {
    for (const [id, val] of Object.entries(partial.keys)) {
      if (val && val.trim()) keys[id] = val.trim();
    }
  }
  // Fusion des tâches.
  const tasks = { ...(current.tasks ?? DEFAULT_PROVIDERS.tasks), ...(partial.tasks ?? {}) };
  const next: ProvidersConfig = {
    tasks,
    visionProvider: partial.visionProvider ?? current.visionProvider,
    keys,
    // On retire les champs hérités une fois les tâches définies explicitement.
    imageProvider: undefined,
    imageModel: undefined,
  };
  await db.siteContent.upsert({
    where: { key: KEY_PROVIDERS },
    update: { value: next as object },
    create: { key: KEY_PROVIDERS, value: next as object },
  });
}
