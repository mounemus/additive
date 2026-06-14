import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Compte", path: "/account" });

export default function AccountPage() {
  return (
    <section className="flex min-h-[70vh] items-center pt-24">
      <div className="container max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border">
          <User className="h-6 w-6 text-accent-blue" />
        </div>
        <p className="eyebrow mb-3">Espace client</p>
        <h1 className="font-display text-display-md font-bold">Votre compte arrive.</h1>
        <p className="mt-5 leading-relaxed text-muted">
          Le suivi de commandes et de configurations sauvegardées sera bientôt
          disponible. En attendant, vos demandes et personnalisations sont
          suivies par email par notre atelier montréalais.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/personnalisation">
            <Button size="lg">Créer ma monture</Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg">Nous contacter</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
