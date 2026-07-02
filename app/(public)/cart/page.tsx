import { buildMetadata } from "@/lib/seo";
import { CartClient } from "@/components/cart/cart-client";

export const metadata = buildMetadata({ title: "Panier", path: "/cart" });

/**
 * Panier réel : la configuration issue du configurateur (stockée localement)
 * est finalisée ici — envoi à l'atelier ou paiement d'acompte Stripe.
 */
export default function CartPage() {
  return (
    <section className="pb-14 pt-28 md:pt-32">
      <CartClient />
    </section>
  );
}
