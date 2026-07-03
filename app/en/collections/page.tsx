import { CollectionCard } from "@/components/product/collection-card";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { getCollections } from "@/lib/catalog";
import { buildMetadata } from "@/lib/seo";

// ISR : même politique que /collections (régénération au plus toutes les 5 min).
export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Collections",
  description:
    "MODUL’AIR, GENERATIVE, HYBRIDE: three collections of 3D-printed eyewear. Modular frames, generative design and digital craftsmanship — ADDITIVE, Montréal.",
  path: "/en/collections",
  locale: "en",
  alternate: "/collections",
});

export default async function EnglishCollectionsPage() {
  const collections = await getCollections();

  return (
    <>
      <section className="pb-12 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Collections</p>
          </FadeIn>
          <AnimatedText
            text="Three ways to inhabit a face."
            className="max-w-3xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Modularity, algorithmic generation or digital craftsmanship:
              each collection explores one path of additive manufacturing.
              All of them share the same standard — lightness, comfort,
              personal fit.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="container grid gap-6 md:grid-cols-3">
          {collections.map((c, i) => (
            <CollectionCard key={c.slug} collection={c} index={i} locale="en" />
          ))}
        </div>
      </section>

      <CTASection
        title="None of them feels quite like you? Generate your own."
        button="Create my frame"
      />
    </>
  );
}
