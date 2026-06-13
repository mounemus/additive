import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({ email: z.string().email() });

/** Inscription à l'infolettre — stockée comme demande de type « newsletter ». */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  try {
    await db.contactRequest.create({
      data: {
        name: "Infolettre",
        email: parsed.data.email,
        type: "newsletter",
        message: "Inscription à l’infolettre.",
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[newsletter] error:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
