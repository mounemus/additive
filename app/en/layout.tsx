import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HtmlLang } from "@/components/layout/html-lang";
import { organizationJsonLd } from "@/lib/seo";

/**
 * Layout du segment anglais (/en/…).
 *
 * Il vit dans app/en (et non dans app/(public)/en) : les layouts App Router
 * se COMPOSENT — un layout en/ imbriqué sous (public)/layout.tsx aurait rendu
 * Navbar/Footer deux fois. Ce segment frère reproduit donc le layout public
 * avec le chrome localisé EN ; le layout FR existant reste intact.
 *
 * Langue : App Router ne permet pas de changer <html lang> par segment.
 * Choix pragmatique documenté : lang="fr" reste sur <html> (layout racine),
 * lang="en" est posé sur le <main> des pages EN (garanti côté serveur),
 * et <HtmlLang> ajuste document.documentElement.lang côté client.
 */
export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Skip-link : premier élément focusable, visible au focus clavier. */}
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <HtmlLang lang="en" />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />
      <Navbar locale="en" />
      <main id="content" lang="en" className="min-h-screen">
        {children}
      </main>
      <Footer locale="en" />
    </>
  );
}
