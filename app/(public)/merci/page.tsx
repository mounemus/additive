import Link from "next/link";
import Stripe from "stripe";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { sendEmail, notifyAtelier, customizationClientEmail, atelierNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Merci",
  description: "Confirmation de votre commande Additive.",
  path: "/merci",
});

/**
 * Retour de Stripe Checkout. La session est vérifiée AUPRÈS DE STRIPE
 * (jamais sur la foi de l'URL) ; au premier passage payé, la demande passe
 * en `paid` et les e-mails de confirmation partent.
 */
export default async function MerciPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  let state: "paid" | "pending" | "invalid" = "invalid";
  let conceptLabel: string | null = null;

  if (sessionId && stripeKey && /^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    try {
      const stripe = new Stripe(stripeKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const requestId = session.metadata?.requestId;
      if (session.payment_status === "paid" && requestId) {
        state = "paid";
        const request = await db.customizationRequest.findUnique({ where: { id: requestId } });
        conceptLabel = request?.conceptLabel ?? null;
        // Idempotent : e-mails et statut uniquement au premier passage.
        if (request && request.status === "pending_payment") {
          await db.customizationRequest.update({
            where: { id: requestId },
            data: {
              status: "paid",
              note: `${request.note ?? ""}\nAcompte payé (Stripe ${session.id}).`.trim(),
            },
          });
          const clientMail = customizationClientEmail({
            name: request.name,
            conceptLabel: request.conceptLabel,
            total: request.estimatedPrice,
            currency: request.currency,
            paid: true,
          });
          void sendEmail({ to: request.email, ...clientMail, replyTo: process.env.ADMIN_EMAIL });
          const notif = atelierNotificationEmail({
            kind: "paiement",
            name: request.name,
            email: request.email,
            conceptLabel: request.conceptLabel,
            total: request.estimatedPrice,
            requestId: request.id,
          });
          notifyAtelier(notif.subject, notif.html);
        }
      } else if (session.payment_status === "unpaid") {
        state = "pending";
      }
    } catch (e) {
      console.error("[merci] vérification session:", e);
    }
  }

  return (
    <section className="pb-24 pt-36 md:pt-44">
      <div className="container max-w-xl text-center">
        {state === "paid" ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent-blue" />
            <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">
              Acompte reçu. Votre monture entre en fabrication.
            </h1>
            <p className="mt-4 leading-relaxed text-muted">
              {conceptLabel ? `Votre concept « ${conceptLabel} » est` : "Votre configuration est"}{" "}
              transmis en priorité à notre atelier montréalais. Un e-mail de
              confirmation vient de vous être envoyé ; nous revenons vers vous
              sous 48 h ouvrables pour les derniers détails.
            </p>
          </>
        ) : state === "pending" ? (
          <>
            <AlertTriangle className="mx-auto h-14 w-14 text-amber-500" />
            <h1 className="mt-6 font-display text-3xl font-bold">Paiement en attente</h1>
            <p className="mt-4 text-muted">
              Votre paiement n&rsquo;est pas encore confirmé. Votre demande est bien
              enregistrée — vous pouvez retenter le paiement depuis votre panier.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent-blue" />
            <h1 className="mt-6 font-display text-3xl font-bold">Merci.</h1>
            <p className="mt-4 text-muted">Votre demande est bien enregistrée.</p>
          </>
        )}
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
            Retour à l&rsquo;accueil
          </Link>
          <Link href="/collections" className="rounded-full border border-border px-6 py-3 text-sm font-medium">
            Voir les collections
          </Link>
        </div>
      </div>
    </section>
  );
}
