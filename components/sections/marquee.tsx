/**
 * Marquee technique — specs réelles en défilement continu.
 * Vitesse contrôlée par prop, pause au survol (animation-play-state).
 */
export function Marquee({ items, speedSec = 32 }: { items: string[]; speedSec?: number }) {
  const row = [...items, ...items];
  return (
    <div className="group overflow-hidden border-y border-border bg-surface py-4" aria-hidden>
      <div
        className="flex w-max animate-marquee gap-12 motion-reduce:animate-none group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speedSec}s` }}
      >
        {row.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-12 whitespace-nowrap font-display text-sm uppercase tracking-[0.3em] text-muted"
          >
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
          </span>
        ))}
      </div>
    </div>
  );
}
