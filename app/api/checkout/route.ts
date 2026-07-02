import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { db } from "@/lib/db";
import { computeQuote } from "@/lib/configurator";
import { getPricingConfig } from "@/lib/configurator-settings";
import { quoteOptionsSchema } from "@/lib/validations";
import { guard, RULES } from "@/lib/rate-limit";

/**
 * Paiement de l'ACOMPTE (Stripe Checkout) sur une configuration validée.
 *
 * Le montant est TOUJOURS recalculé côté serveur à partir des options brutes
 * — jamais accepté du client. La demande est d'abord enregistrée en
 * `pending_payment`, puis confirmée `paid` au retour (/merci) après
 * vérification de la session auprès de Stripe.
 */

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  conceptLabel: z.string().min(1).max(120),
  conceptSummary: z.string().max(2000).optional(),
  boldness: z.enum(["discret", "equilibre", "affirme"]).default("equilibre"),
  styleTags: z.array(z.string().max(40)).max(8).default([]),
  faceShape: z.string().max(40).optional(),
  measurements: z.record(z.string(), z.number()).optional(),
  options: quoteOptionsSchema.partial().optional(),
  message: z.string().max(5000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const limited = await guard(req, "form", RULES.form);
  if (limited) return limited;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "payments_disabled" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });

  // Montant : recalcul serveur intégral.
  const pricing = await getPricingConfig();
  const quote = computeQuote(
    quoteOptionsSchema.parse({
      conceptLabel: parsed.data.conceptLabel,
      boldness: parsed.data.boldness,
      ...(parsed.data.options ?? {}),
    }),
    pricing
  );
  const rate = Math.min(1, Math.max(0.1, Number(process.env.STRIPE_DEPOSIT_RATE ?? 0.3)));
  const deposit = Math.ceil(quote.total * rate);

  try {
    // La demande existe AVANT le paiement : rien ne se perd si Stripe échoue.
    const request = await db.customizationRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        faceShape: parsed.data.faceShape ?? null,
        measurements: (parsed.data.measurements as object) ?? undefined,
        styleTags: parsed.data.styleTags,
        boldness: parsed.data.boldness,
        conceptLabel: parsed.data.conceptLabel,
        conceptSummary: parsed.data.conceptSummary ?? null,
        options: (parsed.data.options as object) ?? undefined,
        estimatedPrice: quote.total,
        currency: quote.currency,
        message: parsed.data.message || null,
        status: "pending_payment",
        note: `Acompte attendu : ${deposit} $ ${quote.currency} (${Math.round(rate * 100)} %).`,
      },
    });

    const stripe = new Stripe(stripeKey);
    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.data.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: quote.currency.toLowerCase(),
            unit_amount: deposit * 100,
            product_data: {
              name: `Acompte — monture « ${parsed.data.conceptLabel} » sur mesure`,
              description: `Acompte de ${Math.round(rate * 100)} % sur une estimation de ${quote.total} $ ${quote.currency}. Solde à la validation atelier.`,
            },
          },
        },
      ],
      metadata: { requestId: request.id },
      success_url: `${origin}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?paiement=annule`,
    });

    return NextResponse.json({ ok: true, url: session.url, requestId: request.id });
  } catch (e) {
    console.error("[checkout] erreur:", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
