import "server-only";
import { db } from "@/lib/db";
import { MODULAIR_DEFAULT_CONFIG, type ModulairConfig } from "@/lib/modulair";

const KEY = "modulair.config";

/** Config MODUL'AIR (éléments de combinaison + prix), administrable. */
export async function getModulairConfig(): Promise<ModulairConfig> {
  try {
    const row = await db.siteContent.findUnique({ where: { key: KEY } });
    if (row) return { ...MODULAIR_DEFAULT_CONFIG, ...(row.value as object) } as ModulairConfig;
  } catch {
    // base absente → défauts
  }
  return MODULAIR_DEFAULT_CONFIG;
}

export async function saveModulairConfig(value: ModulairConfig) {
  await db.siteContent.upsert({
    where: { key: KEY },
    update: { value: value as object },
    create: { key: KEY, value: value as object },
  });
}
