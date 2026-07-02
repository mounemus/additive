import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { organizationJsonLd } from "@/lib/seo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Skip-link : premier élément focusable, visible au focus clavier. */}
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />
      <Navbar />
      <main id="contenu" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
