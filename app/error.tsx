"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Page d'erreur applicative (boundary App Router). Message générique côté
 * client — le détail technique reste dans les logs serveur.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erreur non gérée:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-blue">Erreur</p>
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
        Quelque chose s&rsquo;est mal passé.
      </h1>
      <p className="mt-4 max-w-md text-muted">
        L&rsquo;incident est enregistré. Réessayez — si le problème persiste,
        écrivez-nous et nous nous en occupons.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Retour à l&rsquo;accueil
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-muted">Référence : {error.digest}</p>
      )}
    </div>
  );
}
