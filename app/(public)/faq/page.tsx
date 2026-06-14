import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { getContent } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Questions fréquentes",
  description:
    "Solidité du nylon PA12, verres correcteurs, délais de fabrication, personnalisation, entretien : les réponses aux questions fréquentes sur les lunettes imprimées en 3D ADDITIVE.",
  path: "/faq",
});

const EXTRA: { q: string; a: string }[] = [
  { q: "Comment entretenir ma monture imprimée en 3D ?", a: "Nettoyez-la à l’eau tiède savonneuse et séchez-la avec un chiffon doux. Le nylon PA12 supporte bien l’usage quotidien ; évitez toutefois les sources de chaleur extrême prolongée." },
  { q: "Puis-je remplacer une branche ou un module ?", a: "Sur la collection MODUL’AIR, oui : faces, branches et verres sont interchangeables. Vous pouvez réparer ou faire évoluer un module sans racheter la paire." },
  { q: "Livrez-vous à l’international ?", a: "Nous expédions depuis Montréal. Pour les modalités exactes de livraison et de retour selon votre pays, contactez-nous — ces informations sont en cours de finalisation." },
];

export default async function FaqPage() {
  const base = await getContent<{ q: string; a: string }[]>("faq");
  const faq = [...(base ?? []), ...EXTRA];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="pb-12 pt-36 md:pt-44">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">FAQ</p>
          </FadeIn>
          <AnimatedText text="Questions fréquentes." className="font-display text-display-lg font-bold" />
        </div>
      </section>

      <section className="pb-24">
        <div className="container max-w-3xl space-y-4">
          {faq.map((item) => (
            <FadeIn key={item.q}>
              <details className="group rounded-2xl border border-border bg-surface p-6 open:shadow-card">
                <summary className="cursor-pointer list-none font-display font-semibold marker:hidden">
                  {item.q}
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      <CTASection title="Une autre question ? Parlons-en." button="Nous contacter" href="/contact" />
    </>
  );
}
