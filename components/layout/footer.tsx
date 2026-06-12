import Link from "next/link";
import { Logo } from "@/components/layout/logo";

const FOOTER_COLUMNS = [
  {
    title: "Explorer",
    links: [
      { href: "/collections/modulair", label: "MODUL’AIR" },
      { href: "/collections/generative", label: "GENERATIVE" },
      { href: "/collections/hybride", label: "HYBRIDE" },
      { href: "/produits", label: "Tous les modèles" },
    ],
  },
  {
    title: "La marque",
    links: [
      { href: "/manifeste", label: "Manifeste" },
      { href: "/technologie", label: "Technologie" },
      { href: "/about", label: "À propos" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/personnalisation", label: "Créer ma monture" },
      { href: "/contact?type=partenariat", label: "Devenir détaillant" },
      { href: "/contact?type=presse", label: "Presse" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="section-dark border-t border-border">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted">
              Lunetterie modulaire imprimée en 3D. Design paramétrique, nylon
              PA12, personnalisation morphologique — conçue et fabriquée à la
              demande à Montréal.
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">
              Montréal · Québec · Canada
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="eyebrow mb-5">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ADDITIVE. Tous droits réservés.</p>
          <p className="font-display uppercase tracking-[0.3em]">
            Design numérique · Fabrication additive · Identité personnelle
          </p>
        </div>
      </div>
    </footer>
  );
}
