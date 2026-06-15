import { Printer, Atom, GitBranch, PackageCheck, Recycle, Puzzle } from "lucide-react";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";

const ICONS = [Printer, Atom, GitBranch, PackageCheck, Recycle, Puzzle];

type TechnologyContent = {
  title: string;
  intro: string;
  blocks: { title: string; body: string }[];
};

export function TechnologySection({
  content,
  compact = false,
}: {
  content: TechnologyContent;
  compact?: boolean;
}) {
  const blocks = compact ? content.blocks.slice(0, 6) : content.blocks;
  return (
    <section className="section-dark relative overflow-hidden py-24 md:py-32">
      {/* Arrière-plan « fade neutre » généré (Nano Banana) */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url(/images/bg/tech-neutral.png)" }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0b0d10] via-[#0b0d10]/55 to-[#0b0d10]" />
      <div className="container relative">
        <FadeIn>
          <p className="eyebrow mb-4">Technologie</p>
        </FadeIn>
        <AnimatedText
          text={content.title}
          className="max-w-3xl font-display text-display-lg font-bold"
        />
        <FadeIn delay={0.2}>
          <p className="mt-6 max-w-2xl leading-relaxed text-muted">
            {content.intro}
          </p>
        </FadeIn>

        <Stagger className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <StaggerItem key={block.title}>
                <div className="group h-full bg-surface p-8 transition-colors duration-500 hover:bg-surface-dark">
                  <Icon className="h-6 w-6 text-accent-blue transition-transform duration-500 group-hover:scale-110" />
                  <h3 className="mt-5 font-display text-lg font-semibold">
                    {block.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {block.body}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
