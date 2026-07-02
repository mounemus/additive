import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { Configurator } from "@/components/configurator/configurator";
import { CustomizationSteps } from "@/components/sections/customization-steps";
import { getContent } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Personnalisation — Créer ma monture",
  description:
    "Créez vos lunettes sur mesure : morphologie, style, couleurs, verres et finitions. Trois concepts générés pour vous, une estimation transparente. Lunettes imprimées en 3D à Montréal.",
  path: "/personnalisation",
});

export default async function CustomizationPage({
  searchParams,
}: {
  searchParams: { base?: string };
}) {
  const faq = await getContent<{ q: string; a: string }[]>("faq");

  return (
    <>
      <section className="pb-10 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Personnalisation</p>
          </FadeIn>
          <AnimatedText
            text="Créer ma monture."
            className="font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Un parcours guidé qui traduit votre visage, votre style et votre
              personnalité en concepts de montures imprimables — avec une
              estimation transparente, calculée par notre atelier.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <Configurator baseModel={searchParams.base} />
        </div>
      </section>

      <CustomizationSteps />

      {faq?.length > 0 && (
        <section className="pb-24">
          <div className="container max-w-3xl">
            <h2 className="mb-10 font-display text-display-md font-bold">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
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
          </div>
        </section>
      )}
    </>
  );
}
