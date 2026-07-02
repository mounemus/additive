import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * TOTP RFC 6238 en pur Node crypto — aucune dépendance externe.
 *
 * HMAC-SHA1, codes à 6 chiffres, période de 30 s, fenêtre de tolérance
 * ±1 période (dérive d'horloge du téléphone). Secret encodé en base32
 * (RFC 4648) pour être saisi/scanné dans une app d'authentification
 * (Google Authenticator, Aegis, 1Password…).
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_SEC = 30;
const DIGITS = 6;

/** Encode un buffer en base32 RFC 4648 (sans padding). */
export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** Décode une chaîne base32 RFC 4648 (padding et espaces tolérés). */
export function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/[\s=]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error("Caractère base32 invalide");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Code HOTP (RFC 4226) pour un compteur donné. */
function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(msg).digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code =
    (((digest[offset] & 0x7f) << 24) |
      (digest[offset + 1] << 16) |
      (digest[offset + 2] << 8) |
      digest[offset + 3]) %
    10 ** DIGITS;
  return code.toString().padStart(DIGITS, "0");
}

/** Code TOTP attendu pour un instant donné (ms epoch). */
export function totpCode(secretBase32: string, nowMs = Date.now()): string {
  const counter = Math.floor(nowMs / 1000 / PERIOD_SEC);
  return hotp(base32Decode(secretBase32), counter);
}

/**
 * Vérifie un code TOTP avec une fenêtre de ±`window` périodes (défaut 1,
 * soit ±30 s). Comparaison en temps constant.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  window = 1,
  nowMs = Date.now()
): boolean {
  const normalized = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  let secret: Buffer;
  try {
    secret = base32Decode(secretBase32);
  } catch {
    return false;
  }
  if (secret.length === 0) return false;

  const counter = Math.floor(nowMs / 1000 / PERIOD_SEC);
  const given = Buffer.from(normalized);
  let ok = false;
  for (let i = -window; i <= window; i++) {
    const expected = Buffer.from(hotp(secret, counter + i));
    // Pas de court-circuit : on parcourt toute la fenêtre en temps constant.
    if (timingSafeEqual(expected, given)) ok = true;
  }
  return ok;
}

/** Génère un secret TOTP aléatoire (20 octets = 160 bits, base32). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** URI otpauth:// à copier/scanner dans l'app d'authentification. */
export function totpUri(email: string, secretBase32: string): string {
  const issuer = "Additive";
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD_SEC),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
