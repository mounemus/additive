import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Coffre pour les secrets stockés en base (clés de fournisseurs IA).
 *
 * AES-256-GCM, clé dérivée de NEXTAUTH_SECRET : la base seule ne suffit plus
 * à lire les clés — il faut aussi l'environnement Vercel. Format scellé :
 * `enc.v1.<iv>.<tag>.<cipher>` (base64url).
 *
 * Compat ascendante : une valeur qui ne porte pas le préfixe est traitée comme
 * du clair (anciennes clés) et sera scellée à la prochaine sauvegarde.
 * Fail-open : sans NEXTAUTH_SECRET, on stocke/relit en clair (avec warning) —
 * le chiffrement ne doit jamais rendre les clés illisibles.
 */

const PREFIX = "enc.v1.";
let warned = false;

function masterKey(): Buffer | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    if (!warned) {
      warned = true;
      console.warn("[secret-box] NEXTAUTH_SECRET absent ou trop court — clés stockées en clair.");
    }
    return null;
  }
  return createHash("sha256").update(`additive.secret-box.${secret}`).digest();
}

export function seal(plain: string): string {
  const key = masterKey();
  if (!key || !plain) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const b64 = (b: Buffer) => b.toString("base64url");
  return `${PREFIX}${b64(iv)}.${b64(tag)}.${b64(enc)}`;
}

export function open(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value; // clair (héritage)
  const key = masterKey();
  if (!key) return ""; // scellé mais secret indisponible : ne jamais renvoyer le blob
  try {
    const [iv, tag, data] = value.slice(PREFIX.length).split(".");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch (e) {
    console.error("[secret-box] déchiffrement impossible (NEXTAUTH_SECRET changé ?):", e);
    return "";
  }
}

export function isSealed(value: string): boolean {
  return value.startsWith(PREFIX);
}
