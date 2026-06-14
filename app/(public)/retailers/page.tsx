import { Store, Boxes, Sparkles } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ContactForm } from "@/components/sections/contact-form";
import { RevealImage } from "@/components/motion/reveal-image";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Devenir détaillant",
  description:
    "Opticiens et concept stores : rejoignez le réseau ADDITIVE. Des lunettes imprimées en 3D, modulaires et personnalisables, fabriquées à la demande à Montréal — sans surstock.",
  path: "/retailers",
});

const ARGS = [
  { icon: Boxes, title: "Zéro surstock", body: "Production à la demande : présentez la collection sans immobiliser d’inventaire." },
  { icon: Sparkles, title: "Différenciation", body: "Une offre de personnalisation et de modularité que la production de masse ne propose pas." },
  { icon: Store, title: "Fabrication locale", body: "Conçues et imprimées à Montréal — circuits courts, délais maîtrisés." },
];

export default function RetailersPage() {
  return (
    <>
      <section className="pb-16 pt-36 md:pt-44">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">B2B — Détaillants</p>
          </FadeIn>
          <AnimatedText
            text="Proposez une lunetterie qui n’existe nulle part ailleurs."
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Opticiens, concept stores et boutiques de design : rejoignez le
              réseau ADDITIVE et offrez des montures imprimées en 3D, modulaires
              et personnalisables, fabriquées à la demande.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <RevealImage
            src="/images/editorial/matter-band.png"
            alt="Collection de montures ADDITIVE pour détaillants"
            className="aspect-[16/7] rounded-3xl"
            sizes="(max-width: 1320px) 100vw, 1320px"
          />
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <Stagger className="grid gap-6 md:grid-cols-3">
            {ARGS.map((a) => (
              <StaggerItem key={a.title}>
                <div className="h-full rounded-2xl border border-border bg-surface p-8">
                  <a.icon className="h-6 w-6 text-accent-blue" />
                  <h2 className="mt-4 font-display text-xl font-semibold">{a.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{a.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="pb-24">
        <div className="container grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="font-display text-display-md font-bold">Devenons partenaires.</h2>
            <p className="mt-5 leading-relaxed text-muted">
              Parlez-nous de votre point de vente. Nous revenons vers vous avec
              les conditions de partenariat, le kit de présentation et les
              modalités d’approvisionnement.
            </p>
          </div>
          <FadeIn delay={0.1}>
            <div className="rounded-3xl border border-border bg-surface p-8 md:p-10">
              <ContactForm defaultType="partenariat" />
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
