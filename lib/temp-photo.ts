import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Photos temporaires — confidentialité d'abord.
 * Durée de vie courte, purge automatique opportuniste, suppression par token.
 */
const TTL_MINUTES = 120;

export function newToken(): string {
  return randomBytes(16).toString("hex");
}

/** Purge des photos expirées (appelée opportunément à chaque écriture). */
export async function purgeExpired(): Promise<void> {
  try {
    await db.tempPhoto.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch {
    // base absente / colonne manquante → ignorer
  }
}

export async function storeTempPhoto(
  dataUrl: string,
  kind: string
): Promise<string | null> {
  try {
    await purgeExpired();
    const token = newToken();
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000);
    await db.tempPhoto.create({ data: { token, dataUrl, kind, expiresAt } });
    return token;
  } catch (e) {
    console.error("[temp-photo] store failed:", e);
    return null;
  }
}

export async function deleteTempPhoto(token: string): Promise<boolean> {
  try {
    await db.tempPhoto.deleteMany({ where: { token } });
    return true;
  } catch {
    return false;
  }
}
