/**
 * Symbole ADDITIVE — triangle impossible (interlock), trait fin, descendant.
 * Utilise currentColor pour s'adapter aux fonds clairs/sombres.
 *
 * Recréation vectorielle propre du symbole de marque. Si le SVG source exact
 * est fourni, il suffit de remplacer ce composant ou public/icon.svg.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 104"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinejoin="round"
      strokeLinecap="round"
      role="img"
      aria-label="ADDITIVE"
    >
      {/* Triangle extérieur (descendant) */}
      <path d="M8 14 L112 14 L60 96 Z" />
      {/* Triangle médian — décalé pour l'effet d'entrelacs */}
      <path d="M26 26 L101 24 L62 80" />
      {/* Triangle intérieur */}
      <path d="M40 36 L86 35 L63 66" />
    </svg>
  );
}
