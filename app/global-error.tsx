"use client";

/**
 * Filet ultime : erreur dans le layout racine lui-même. Rendu autonome
 * (html/body inclus), sans dépendance au design system qui a pu casser.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f3f2ed",
          color: "#0b0d10",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>ADDITIVE — incident technique</h1>
        <p style={{ maxWidth: 440, color: "#5d636e", lineHeight: 1.6 }}>
          Le site a rencontré une erreur inattendue. L&rsquo;incident est enregistré.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 20,
            padding: "12px 26px",
            borderRadius: 999,
            border: 0,
            background: "#1557ff",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
        {error.digest && (
          <p style={{ marginTop: 18, fontSize: 12, color: "#8a8f98" }}>Référence : {error.digest}</p>
        )}
      </body>
    </html>
  );
}
