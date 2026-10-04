import { withBase } from "@/lib/base-path";
import { MapPin, Factory, Users, Store } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { RevealImage } from "@/components/motion/reveal-image";
import { CTASection } from "@/components/sections/cta-section";
import { EN_CONTENT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

// Même politique de rendu que /about.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "About — A Montréal eyewear startup",
  description:
    "ADDITIVE is a Canadian additive-eyewear startup based in Montréal. Modular design, 3D printing, morphological customization and responsible production.",
  path: "/en/about",
  locale: "en",
  alternate: "/about",
});

const VALUES = [
  {
    icon: MapPin,
    title: "Montréal, workshop and home port",
    body: "Design, prototyping and on-demand production in Québec: short circuits, direct quality control and local know-how.",
  },
  {
    icon: Factory,
    title: "Additive manufacturing",
    body: "SLS 3D printing is not a marketing gimmick: it is what makes modularity, customization and stock-free production possible.",
  },
  {
    icon: Users,
    title: "People at the centre",
    body: "Morphology, style, personality: technology serves the fit to the person — never the other way around.",
  },
  {
    icon: Store,
    title: "A growing network",
    body: "Opticians, concept stores and retailers: we are building a network of partners who share our standards. Let’s talk.",
  },
];

export default function EnglishAboutPage() {
  const brand = EN_CONTENT.brand;

  return (
    <>
      <section className="pb-12 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">About</p>
          </FadeIn>
          <AnimatedText
            text="An eyewear house born of the printer, raised in Montréal."
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {brand.positioning}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <RevealImage
            src={withBase("/images/collections/hybride.svg")}
            alt="ADDITIVE workshop — additive manufacturing in Montréal"
            className="aspect-[16/7] rounded-3xl"
            sizes="(max-width: 1320px) 100vw, 1320px"
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <Stagger className="grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-2xl border border-border bg-surface p-8">
                  <v.icon className="h-6 w-6 text-accent-blue" />
                  <h2 className="mt-4 font-display text-xl font-semibold">
                    {v.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted">{v.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection
        title="Retailer, press, or simply curious? Write to us."
        button="Contact us"
        href="/en/contact"
      />
    </>
  );
}
