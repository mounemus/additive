import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { LanguageSwitch } from "@/components/layout/language-switch";

const FOOTER_COLUMNS = [
  {
    title: "Explorer",
    links: [
      { href: "/collections/modulair", label: "MODUL’AIR" },
      { href: "/collections/generative", label: "GENERATIVE" },
      { href: "/collections/hybride", label: "HYBRIDE" },
      { href: "/produits", label: "Tous les modèles" },
      { href: "/lookbook", label: "Lookbook" },
    ],
  },
  {
    title: "La marque",
    links: [
      { href: "/manifeste", label: "Manifeste" },
      { href: "/technologie", label: "Technologie" },
      { href: "/process", label: "Le procédé" },
      { href: "/journal", label: "Journal" },
      { href: "/about", label: "À propos" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/personnalisation", label: "Créer mes lunettes" },
      { href: "/personnalisation/modulair", label: "Moduler mes lunettes" },
      { href: "/retailers", label: "Devenir détaillant" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="section-dark border-t border-border">
      {/* Bandeau signature éditorial */}
      <div className="container border-b border-border py-16 md:py-24">
        <div className="grid items-end gap-10 md:grid-cols-[1.6fr_1fr]">
          <p className="max-w-3xl text-balance font-display text-display-md font-bold leading-[1.05]">
            Pas conçues pour tout le monde.
            <br />
            <span className="text-accent-blue">Conçues pour vous.</span>
          </p>
          <div>
            <p className="eyebrow mb-4">Restez informé·e</p>
            <NewsletterForm />
            <p className="mt-3 text-xs text-muted">
              Nouvelles collections, modules et coulisses d’atelier. Pas de spam.
            </p>
          </div>
        </div>
      </div>

      <div className="container py-14 md:py-16">
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
          <div className="flex items-center gap-5">
            <Link href="/contact" className="hover:text-foreground">Livraison &amp; retours</Link>
            <Link href="/manifeste" className="hover:text-foreground">Confidentialité</Link>
            <LanguageSwitch />
          </div>
        </div>
      </div>
    </footer>
  );
}
