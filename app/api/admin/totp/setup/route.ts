import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { seal } from "@/lib/secret-box";
import { generateTotpSecret, totpUri } from "@/lib/totp";
import { logAudit } from "@/lib/audit";

/**
 * Démarre l'enrôlement 2FA : génère un secret TOTP, le stocke SCELLÉ
 * (AES-256-GCM) sur l'AdminUser de la session avec totpEnabled=false.
 * C'est la seule réponse où le secret sort en clair (pour saisie/scan
 * dans l'app d'authentification). L'activation se fait via /verify.
 */
export async function POST() {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = session.user?.email;
  if (!email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const secret = generateTotpSecret();
    await db.adminUser.update({
      where: { email },
      data: { totpSecret: seal(secret), totpEnabled: false },
    });
    logAudit("totp.setup", "AdminUser", undefined, "nouveau secret généré");
    return NextResponse.json({ secret, uri: totpUri(email, secret) });
  } catch (e) {
    console.error("[admin/totp/setup] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
