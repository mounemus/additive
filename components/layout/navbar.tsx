"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight, Search, User, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/collections", label: "Collections" },
  { href: "/produits", label: "Modèles" },
  { href: "/personnalisation", label: "Personnalisation" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/technologie", label: "Technologie" },
  { href: "/manifeste", label: "Manifeste" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastYRef = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Masque en descendant (au-delà du hero), réaffiche en remontant.
      if (y > 120 && y > lastYRef.current + 6) setHidden(true);
      else if (y < lastYRef.current - 6) setHidden(false);
      lastYRef.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 will-change-transform",
        // Fond token-based dans les deux états : garantit le contraste du
        // texte/logo sur les heros sombres comme sur les sections claires.
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "bg-background/55 backdrop-blur-md",
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring relative rounded-sm py-1 text-sm transition-colors hover:text-foreground",
                  // État actif : couleur + soulignement (nav-state-active).
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent-blue after:transition-transform after:duration-200",
                  active
                    ? "font-medium text-foreground after:scale-x-100"
                    : "text-muted"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/produits"
            aria-label="Rechercher des modèles"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/account"
            aria-label="Compte"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link
            href="/cart"
            aria-label="Panier"
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
          </Link>
          <ThemeToggle />
          <Link href="/personnalisation" className="ml-2">
            <Button size="sm" className="gap-1.5">
              Créer ma monture
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-border"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-b border-border bg-background lg:hidden"
            aria-label="Navigation mobile"
          >
            <div className="container flex flex-col gap-1 py-6">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    aria-current={pathname?.startsWith(link.href) ? "page" : undefined}
                    className={cn(
                      "focus-ring block rounded-sm py-2.5 font-display text-2xl font-medium",
                      pathname?.startsWith(link.href)
                        ? "text-accent-blue"
                        : "text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link href="/personnalisation" className="mt-4">
                <Button className="w-full" size="lg">
                  Créer ma monture
                </Button>
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
