export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-border bg-surface py-4" aria-hidden>
      <div className="flex w-max animate-marquee gap-12 motion-reduce:animate-none">
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
