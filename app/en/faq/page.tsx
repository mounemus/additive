import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { EN_CONTENT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

// Même politique de rendu que /faq.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Frequently asked questions",
  description:
    "PA12 nylon durability, prescription lenses, production lead times, customization, care: answers to the most frequent questions about ADDITIVE 3D-printed eyewear.",
  path: "/en/faq",
  locale: "en",
  alternate: "/faq",
});

export default function EnglishFaqPage() {
  const faq = EN_CONTENT.faq;

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
      <section className="pb-10 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">FAQ</p>
          </FadeIn>
          <AnimatedText text="Frequently asked questions." className="font-display text-display-lg font-bold" />
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

      <CTASection title="Another question? Let’s talk." button="Contact us" href="/en/contact" />
    </>
  );
}
