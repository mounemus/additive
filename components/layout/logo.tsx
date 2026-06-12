import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-xl font-bold uppercase tracking-[0.35em]",
        className
      )}
      aria-label="ADDITIVE — Accueil"
    >
      Additive
      <span className="text-accent-blue">.</span>
    </Link>
  );
}
