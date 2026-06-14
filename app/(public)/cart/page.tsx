import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Panier", path: "/cart" });

export default function CartPage() {
  return (
    <section className="flex min-h-[70vh] items-center pt-24">
      <div className="container max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border">
          <ShoppingBag className="h-6 w-6 text-accent-blue" />
        </div>
        <p className="eyebrow mb-3">Panier</p>
        <h1 className="font-display text-display-md font-bold">Le paiement en ligne arrive.</h1>
        <p className="mt-5 leading-relaxed text-muted">
          La commande directe sera bientôt disponible. En attendant, configurez
          votre monture et envoyez votre demande à l’atelier — nous vous
          recontactons sous 48 h ouvrables avec un devis et le paiement.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/personnalisation">
            <Button size="lg">Créer ma monture</Button>
          </Link>
          <Link href="/produits">
            <Button variant="outline" size="lg">Voir les modèles</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
