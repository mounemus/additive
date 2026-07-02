import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validations";
import { guard, RULES } from "@/lib/rate-limit";
import { sendEmail, notifyAtelier, contactClientEmail, atelierNotificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const limited = await guard(req, "form", RULES.form);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const created = await db.contactRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        type: parsed.data.type,
        message: parsed.data.message,
      },
    });
    // Accusé de réception + notification atelier (fire-and-forget).
    void sendEmail({
      to: parsed.data.email,
      ...contactClientEmail(parsed.data.name),
      replyTo: process.env.ADMIN_EMAIL,
    });
    const notif = atelierNotificationEmail({
      kind: "contact",
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      requestId: created.id,
    });
    notifyAtelier(notif.subject, notif.html);

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    // Détails techniques côté serveur uniquement — message générique au client.
    console.error("[contact] persistence error:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
