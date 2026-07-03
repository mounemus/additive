import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function Logo({ className, locale = "fr" }: { className?: string; locale?: Locale }) {
  return (
    <Link
      href={locale === "en" ? "/en" : "/"}
      className={cn(
        "focus-ring rounded-sm font-display text-xl font-bold uppercase tracking-[0.35em]",
        className
      )}
      aria-label={locale === "en" ? "ADDITIVE — Home" : "ADDITIVE — Accueil"}
    >
      Additive
      <span className="text-accent-blue">.</span>
    </Link>
  );
}
