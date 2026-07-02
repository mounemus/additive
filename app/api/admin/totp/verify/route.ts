import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { open } from "@/lib/secret-box";
import { verifyTotp } from "@/lib/totp";
import { logAudit } from "@/lib/audit";

const bodySchema = z.object({
  code: z.string().min(1).max(12),
  action: z.enum(["enable", "disable"]),
});

/**
 * Vérifie un code TOTP contre le secret scellé de l'AdminUser de la session.
 * - action=enable : code valide → totpEnabled=true (fin de l'enrôlement).
 * - action=disable : code valide exigé → totpSecret=null, totpEnabled=false.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const email = session.user?.email;
  if (!email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "validation" }, { status: 422 });

  try {
    const user = await db.adminUser.findUnique({ where: { email } });
    if (!user?.totpSecret)
      return NextResponse.json({ ok: false, error: "no_secret" }, { status: 400 });

    const secret = open(user.totpSecret);
    if (!secret || !verifyTotp(secret, parsed.data.code))
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });

    if (parsed.data.action === "enable") {
      await db.adminUser.update({
        where: { email },
        data: { totpEnabled: true },
      });
      logAudit("totp.enable", "AdminUser", user.id);
    } else {
      await db.adminUser.update({
        where: { email },
        data: { totpSecret: null, totpEnabled: false },
      });
      logAudit("totp.disable", "AdminUser", user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/totp/verify] error:", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
