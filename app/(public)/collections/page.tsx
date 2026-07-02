import { CollectionCard } from "@/components/product/collection-card";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { getCollections } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

// ISR : contenu servi en cache et régénéré au plus toutes les 5 min
// (les mutations admin déclenchent une revalidation immédiate).
export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Collections",
  description:
    "MODUL’AIR, GENERATIVE, HYBRIDE : trois collections de lunettes imprimées en 3D. Montures modulaires, design génératif et artisanat numérique — ADDITIVE, Montréal.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <>
      <section className="pb-12 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Collections</p>
          </FadeIn>
          <AnimatedText
            text="Trois manières d’habiter un visage."
            className="max-w-3xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Modularité, génération algorithmique ou artisanat numérique :
              chaque collection explore une voie de la fabrication additive.
              Toutes partagent la même exigence — légèreté, confort,
              personnalisation.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container grid gap-6 md:grid-cols-3">
          {collections.map((c, i) => (
            <CollectionCard key={c.slug} collection={c} index={i} />
          ))}
        </div>
      </section>

      <CTASection
        title="Aucune ne vous ressemble tout à fait ? Générez la vôtre."
        button="Créer ma monture"
      />
    </>
  );
}
