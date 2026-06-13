"use client";

import { ScanFace, PenTool, Layers, Sparkles, Glasses } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";

const STEPS = [
  { id: "scan", label: "SCAN", icon: ScanFace, body: "Analyse morphologique du visage, calibrée au millimètre." },
  { id: "design", label: "DESIGN", icon: PenTool, body: "Adaptation paramétrique de la géométrie à vos mesures." },
  { id: "print", label: "PRINT", icon: Layers, body: "Frittage laser du nylon PA12, couche par couche." },
  { id: "finish", label: "FINISH", icon: Sparkles, body: "Dépoudrage, teinte et finition contrôlée à la main." },
  { id: "wear", label: "WEAR", icon: Glasses, body: "Montée, contrôlée, livrée — prête à être portée." },
];

export function ProcessSequence() {
  return (
    <section className="section-dark py-24 md:py-32">
      <div className="container">
        <FadeIn>
          <p className="eyebrow mb-4">Du visage à l’objet</p>
        </FadeIn>
        <AnimatedText
          text="Scan. Design. Print. Finish. Wear."
          className="max-w-3xl font-display text-display-lg font-bold"
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative bg-surface p-7"
            >
              <span className="font-display text-xs font-bold text-accent-blue">
                {String(i + 1).padStart(2, "0")}
              </span>
              <step.icon className="mt-5 h-7 w-7 text-foreground transition-transform duration-500 group-hover:scale-110" />
              <p className="mt-5 font-display text-lg font-bold tracking-wide">{step.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
