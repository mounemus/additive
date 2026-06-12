import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="eyebrow mb-4">Erreur 404</p>
      <h1 className="font-display text-display-lg font-bold">
        Cette page n’a pas été imprimée.
      </h1>
      <p className="mt-5 max-w-md text-muted">
        L’adresse demandée n’existe pas — ou plus. Retournez à l’atelier pour
        explorer les collections.
      </p>
      <div className="mt-9 flex gap-3">
        <Link href="/">
          <Button size="lg">Retour à l’accueil</Button>
        </Link>
        <Link href="/collections">
          <Button variant="outline" size="lg">
            Voir les collections
          </Button>
        </Link>
      </div>
    </main>
  );
}
