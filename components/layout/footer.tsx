import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { t, type Locale } from "@/lib/i18n";

/**
 * Colonnes du footer par locale. Les liens EN pointent vers les routes /en
 * quand elles existent ; les pages non traduites (lookbook, journal, process,
 * configurateur, détaillants) restent sur leurs routes FR.
 */
function footerColumns(locale: Locale) {
  const en = locale === "en";
  const p = (frPath: string, enPath?: string) => (en && enPath ? enPath : frPath);
  return [
    {
      title: t("footer.col.explore", locale),
      links: [
        { href: p("/collections/modulair", "/en/collections/modulair"), label: "MODUL’AIR" },
        { href: p("/collections/generative", "/en/collections/generative"), label: "GENERATIVE" },
        { href: p("/collections/hybride", "/en/collections/hybride"), label: "HYBRIDE" },
        { href: "/produits", label: t("footer.link.allModels", locale) },
        { href: "/lookbook", label: t("nav.lookbook", locale) },
      ],
    },
    {
      title: t("footer.col.brand", locale),
      links: [
        { href: p("/manifeste", "/en/manifesto"), label: t("nav.manifesto", locale) },
        { href: p("/technologie", "/en/technology"), label: t("nav.technology", locale) },
        { href: "/process", label: t("footer.link.process", locale) },
        { href: "/journal", label: t("footer.link.journal", locale) },
        { href: p("/about", "/en/about"), label: t("nav.about", locale) },
      ],
    },
    {
      title: t("footer.col.services", locale),
      links: [
        { href: "/personnalisation", label: t("cta.create", locale) },
        { href: "/personnalisation/modulair", label: t("footer.link.modulate", locale) },
        { href: "/retailers", label: t("footer.link.retailers", locale) },
        { href: p("/faq", "/en/faq"), label: t("nav.faq", locale) },
        { href: p("/contact", "/en/contact"), label: t("nav.contact", locale) },
      ],
    },
  ];
}

export function Footer({ locale = "fr" }: { locale?: Locale }) {
  const columns = footerColumns(locale);
  return (
    <footer className="section-dark border-t border-border">
      {/* Bandeau signature éditorial */}
      <div className="container border-b border-border py-12 md:py-16">
        <div className="grid items-end gap-10 md:grid-cols-[1.6fr_1fr]">
          <p className="max-w-3xl text-balance font-display text-display-md font-bold leading-[1.05]">
            {t("tagline.line1", locale)}
            <br />
            <span className="text-accent-blue">{t("tagline.line2", locale)}</span>
          </p>
          <div>
            <p className="eyebrow mb-4">{t("footer.newsletter.title", locale)}</p>
            <NewsletterForm locale={locale} />
            <p className="mt-3 text-xs text-muted">
              {t("footer.newsletter.note", locale)}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo locale={locale} />
            <p className="mt-5 text-sm leading-relaxed text-muted">
              {t("footer.brandBlurb", locale)}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted">
              {t("footer.location", locale)}
            </p>
          </div>

          {columns.map((col) => (
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

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ADDITIVE. {t("footer.rights", locale)}</p>
          <div className="flex items-center gap-5">
            <Link
              href={locale === "en" ? "/en/contact" : "/contact"}
              className="hover:text-foreground"
            >
              {t("footer.shipping", locale)}
            </Link>
            <Link
              href={locale === "en" ? "/en/manifesto" : "/manifeste"}
              className="hover:text-foreground"
            >
              {t("footer.privacy", locale)}
            </Link>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
