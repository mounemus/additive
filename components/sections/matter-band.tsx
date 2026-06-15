import { Feather, Shield, Recycle } from "lucide-react";
import { RevealImage } from "@/components/motion/reveal-image";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";

const POINTS = [
  { icon: Feather, title: "Légère par nature", body: "Environ 18 g sur le nez — le nylon PA12 fritté allège sans fragiliser." },
  { icon: Shield, title: "Souple et résistante", body: "Flexible, dotée d’une bonne mémoire de forme, elle encaisse le quotidien." },
  { icon: Recycle, title: "Produite à la demande", body: "Aucun stock, aucun invendu : chaque paire est imprimée après commande, à Montréal." },
];

/** Section matière — nylon PA12 / fabrication additive (faits vérifiables). */
export function MatterBand() {
  return (
    <section className="overflow-hidden py-20 md:py-28">
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <RevealImage
            src="/images/editorial/matter-band.png"
            alt="Échantillons de montures imprimées en 3D, nylon PA12 — ADDITIVE"
            className="aspect-[4/3] rounded-3xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div>
            <FadeIn>
              <p className="eyebrow mb-4">La matière</p>
            </FadeIn>
            <AnimatedText
              text="Légère par nature. Précise par fabrication."
              className="font-display text-display-md font-bold"
            />
            <div className="mt-10 space-y-6">
              {POINTS.map((p) => (
                <FadeIn key={p.title}>
                  <div className="flex gap-4">
                    <p.icon className="mt-0.5 h-6 w-6 shrink-0 text-accent-blue" />
                    <div>
                      <h3 className="font-display font-semibold">{p.title}</h3>
                      <p className="mt-1 leading-relaxed text-muted">{p.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
