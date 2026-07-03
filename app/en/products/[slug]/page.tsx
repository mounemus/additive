import { notFound } from "next/navigation";
import { Sparkles, Feather, ShieldCheck, Leaf } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductDetails } from "@/components/product/product-details";
import { ModulairVideo } from "@/components/configurator/modulair-video";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { CTASection } from "@/components/sections/cta-section";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { buildMetadata, productJsonLd } from "@/lib/seo";
import type { Metadata } from "next";

// ISR : même politique que /produits/[slug] (5 min).
export const revalidate = 300;

const WHY_POINTS = [
  {
    icon: Feather,
    title: "Genuinely light",
    body: "Around 18 g on the nose: sintered PA12 nylon lightens the structure without weakening it.",
  },
  {
    icon: ShieldCheck,
    title: "Shape-memory tough",
    body: "Flexible, with excellent shape memory, it returns to its geometry after twisting.",
  },
  {
    icon: Sparkles,
    title: "Customizable",
    body: "This frame can serve as the base for a full customization: shape, colour, temples, lenses.",
  },
  {
    icon: Leaf,
    title: "Made on demand",
    body: "No stock, nothing unsold: your pair is printed after your order, in Montréal.",
  },
];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return buildMetadata({ title: "Model", locale: "en" });
  return buildMetadata({
    title: `${product.name} — 3D-printed frame`,
    description: product.seoDescription ?? product.shortDescription ?? undefined,
    path: `/en/products/${product.slug}`,
    image: product.image,
    locale: "en",
    alternate: `/produits/${product.slug}`,
  });
}

export default async function EnglishProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product, "en")),
        }}
      />
      <section className="pb-14 pt-28 md:pt-32">
        <div className="container grid gap-12 lg:grid-cols-[1.15fr_1fr]">
          <FadeIn y={16}>
            {/* The navigable 3D viewer is the gallery's primary tab whenever
                a model exists (photos become thumbnails). */}
            <ProductGallery
              images={product.images}
              name={product.name}
              model3dUrl={product.model3dUrl}
              locale="en"
            />
          </FadeIn>
          <FadeIn y={16} delay={0.1}>
            <ProductDetails product={product} locale="en" />
          </FadeIn>
        </div>
      </section>

      {product.description && (
        <section className="border-t border-border py-14">
          <div className="container grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            <h2 className="font-display text-display-md font-bold">
              The design story
            </h2>
            <FadeIn>
              {/* Description affichée telle quelle (contenu DB, déjà rédigé en anglais). */}
              <p className="text-lg leading-relaxed text-muted">
                {product.description}
              </p>
            </FadeIn>
          </div>
        </section>
      )}

      {product.collection?.slug === "modulair" && (
        <section className="border-t border-border py-12 md:py-16">
          <div className="container grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow mb-3">Modular system</p>
              <h2 className="font-display text-display-md font-bold">A frame that composes itself.</h2>
              <p className="mt-4 leading-relaxed text-muted">
                {product.name} belongs to MODUL’AIR: front, temples and lenses
                are interchangeable. Repair, upgrade or recolour a module
                without buying the pair again.
              </p>
              <Link href="/personnalisation/modulair" className="mt-7 inline-block">
                <Button size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" /> Modulate this base
                </Button>
              </Link>
            </div>
            <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-surface to-background">
              <ModulairVideo />
            </div>
          </div>
        </section>
      )}

      <section className="section-dark py-14 md:py-20">
        <div className="container">
          <AnimatedText
            text="Why this frame?"
            className="font-display text-display-md font-bold"
          />
          <div className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {WHY_POINTS.map((point) => (
              <div key={point.title} className="bg-surface p-7">
                <point.icon className="h-6 w-6 text-accent-blue" />
                <h3 className="mt-4 font-display font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="container">
            <h2 className="mb-8 font-display text-display-md font-bold">
              You may also like
            </h2>
            <ProductGrid products={related} locale="en" />
          </div>
        </section>
      )}

      <CTASection
        title={`Make ${product.name} your starting point.`}
        button="Customize this model"
        href={`/personnalisation?base=${product.slug}`}
      />
    </>
  );
}
