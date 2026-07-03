import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { EN_CONTENT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

// Même politique de rendu que /manifeste.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Manifesto",
  description:
    "The ADDITIVE manifesto: digital design, additive manufacturing, personal identity. A new way to design, produce and wear a personal object.",
  path: "/en/manifesto",
  locale: "en",
  alternate: "/manifeste",
});

export default function EnglishManifestoPage() {
  const manifesto = EN_CONTENT.manifesto;

  return (
    <>
      <section className="section-dark pb-14 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-6">Manifesto</p>
          </FadeIn>
          <AnimatedText
            text={manifesto.intro}
            as="h1"
            className="max-w-5xl font-display text-display-lg font-bold leading-tight"
          />
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container max-w-3xl">
          <div className="space-y-16">
            {manifesto.sections.map((section, i) => (
              <FadeIn key={section.title} delay={i * 0.05}>
                <article className="border-l-2 border-accent-blue pl-8">
                  <p className="eyebrow mb-3">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted">
                    {section.body}
                  </p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection title={manifesto.closing} button="Begin" />
    </>
  );
}
