import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { getContent } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Manifeste",
  description:
    "Le manifeste ADDITIVE : design numérique, fabrication additive, identité personnelle. Une nouvelle manière de concevoir, produire et porter un objet personnel.",
  path: "/manifeste",
});

export default async function ManifestoPage() {
  const manifesto = await getContent<{
    title: string;
    intro: string;
    sections: { title: string; body: string }[];
    closing: string;
  }>("manifesto");

  return (
    <>
      <section className="section-dark pb-20 pt-36 md:pt-48">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-6">Manifeste</p>
          </FadeIn>
          <AnimatedText
            text={manifesto.intro}
            as="h1"
            className="max-w-5xl font-display text-display-lg font-bold leading-tight"
          />
        </div>
      </section>

      <section className="py-20 md:py-28">
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

      <CTASection title={manifesto.closing} button="Commencer" />
    </>
  );
}
