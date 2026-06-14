import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";

/**
 * Logo ADDITIVE = symbole (triangle impossible) + wordmark « addi+ive »
 * (le « t » est un plus vert, couleur de marque du wordmark).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5", className)}
      aria-label="ADDITIVE — Accueil"
    >
      <LogoMark className="h-7 w-7" />
      <span className="font-display text-2xl font-bold lowercase tracking-tight">
        addi<span className="text-[#2faa5a]">+</span>ive
      </span>
    </Link>
  );
}
