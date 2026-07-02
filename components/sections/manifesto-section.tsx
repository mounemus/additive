import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { Parallax } from "@/components/motion/parallax";
import { RevealImage } from "@/components/motion/reveal-image";

/** Section éditoriale type magazine — expérience de marque. */
export function ManifestoSection() {
  return (
    <section className="overflow-hidden py-14 md:py-20">
      <div className="container">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">Expérience de marque</p>
            </FadeIn>
            <AnimatedText
              text="L’artisanat numérique a trouvé sa matière."
              className="font-display text-display-md font-bold"
            />
            <FadeIn delay={0.15}>
              <div className="mt-7 space-y-5 leading-relaxed text-muted">
                <p>
                  Chaque monture ADDITIVE naît d’un dialogue : un algorithme
                  propose des géométries, un designer les apprivoise, un laser
                  les matérialise couche par couche dans le nylon. Environ 350
                  couches, 18 grammes, zéro moule.
                </p>
                <p>
                  Le résultat est un objet impossible à produire autrement —
                  précis comme l’ingénierie, personnel comme un vêtement sur
                  mesure, durable parce que produit uniquement à la demande.
                </p>
              </div>
              <Link
                href="/manifeste"
                className="group mt-8 inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
              >
                Lire le manifeste
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </FadeIn>
          </div>

          <Parallax amount={40}>
            <RevealImage
              src="/images/editorial/macro-pa12.png"
              alt="Macro de la surface nylon PA12 imprimée — ADDITIVE"
              className="aspect-[4/5] rounded-3xl"
            />
          </Parallax>
        </div>
      </div>
    </section>
  );
}
