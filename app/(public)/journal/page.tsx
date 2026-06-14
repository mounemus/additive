import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Journal",
  description:
    "Le journal ADDITIVE : design paramétrique, fabrication additive, modularité et matières. Les réflexions et coulisses d’une lunetterie imprimée en 3D à Montréal.",
  path: "/journal",
});

// Lectures réelles existantes (pas de faux articles).
const READS = [
  { href: "/manifeste", tag: "Manifeste", title: "Votre prochaine paire ne sera pas choisie. Elle sera générée.", body: "Design numérique, fabrication additive, identité personnelle — la philosophie ADDITIVE." },
  { href: "/technologie", tag: "Technologie", title: "La fabrication additive, sans le jargon.", body: "Impression 3D SLS, nylon PA12, design paramétrique : comment vos lunettes sont réellement faites." },
  { href: "/process", tag: "Procédé", title: "Du visage à l’objet, en cinq étapes.", body: "Scan, design, print, finish, wear : la chaîne numérique continue derrière chaque monture." },
  { href: "/collections/modulair", tag: "MODUL’AIR", title: "Une monture. Des modules.", body: "Le système modulaire qui transforme la lunette en objet évolutif et réparable." },
];

export default function JournalPage() {
  return (
    <>
      <section className="pb-12 pt-36 md:pt-44">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Journal</p>
          </FadeIn>
          <AnimatedText text="Idées, matières, coulisses." className="font-display text-display-lg font-bold" />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Les réflexions et les coulisses d’une lunetterie imprimée en 3D.
              Le journal s’étoffera au fil des collections — voici par où
              commencer.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <Stagger className="grid gap-6 md:grid-cols-2">
            {READS.map((r) => (
              <StaggerItem key={r.href}>
                <Link
                  href={r.href}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <p className="eyebrow mb-4">{r.tag}</p>
                  <h2 className="font-display text-2xl font-bold leading-tight">{r.title}</h2>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">{r.body}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                    Lire <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section-dark py-20 md:py-28">
        <div className="container max-w-2xl text-center">
          <h2 className="font-display text-display-md font-bold">Recevez le prochain chapitre.</h2>
          <p className="mt-4 text-muted">Nouvelles collections, modules et coulisses d’atelier — directement par email.</p>
          <div className="mx-auto mt-8 max-w-sm">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
