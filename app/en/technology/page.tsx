import { TechnologySection } from "@/components/sections/technology-section";
import { CTASection } from "@/components/sections/cta-section";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { EN_CONTENT } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

// Même politique de rendu que /technologie.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Technology — SLS 3D printing and PA12 nylon",
  description:
    "SLS 3D printing, PA12 nylon, parametric design, local on-demand production: the technology behind ADDITIVE eyewear, explained plainly.",
  path: "/en/technology",
  locale: "en",
  alternate: "/technologie",
});

const PROCESS = [
  {
    step: "01",
    title: "Parametric design",
    body: "The model is defined as a system of parameters: front width, lens height, bridge curvature. Your measurements drive the geometry.",
  },
  {
    step: "02",
    title: "Design validation",
    body: "A designer checks the balance of proportions, the comfort of contact points and the printability of every configuration before production.",
  },
  {
    step: "03",
    title: "SLS laser sintering",
    body: "A laser fuses PA12 nylon powder layer by layer — around 350 layers per frame. Unsintered powder is reused.",
  },
  {
    step: "04",
    title: "Finishing and control",
    body: "Depowdering, micro-bead blasting, through-dyeing, then quality control: every pair is inspected and adjusted by hand before shipping.",
  },
];

export default function EnglishTechnologyPage() {
  return (
    <>
      <section className="pb-8 pt-28 md:pt-32">
        <div className="container">
          <FadeIn>
            <p className="eyebrow mb-4">Technology</p>
          </FadeIn>
          <AnimatedText
            text="Additive manufacturing, without the jargon."
            className="max-w-4xl font-display text-display-lg font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              No unverifiable promises: here is concretely how your glasses
              are designed, printed and finished — and why this process
              changes what a frame can be.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Processus — sections sticky éditoriales */}
      <section className="py-12 md:py-16">
        <div className="container grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-display-md font-bold">
              From measurement to object.
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              One continuous digital chain: no step is outsourced to
              approximation. Every frame travels through these four phases.
            </p>
          </div>
          <div className="space-y-6">
            {PROCESS.map((p, i) => (
              <FadeIn key={p.step} delay={i * 0.08}>
                <div className="flex gap-6 rounded-2xl border border-border bg-surface p-7">
                  <span className="font-display text-3xl font-bold text-accent-blue">
                    {p.step}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {p.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <TechnologySection content={EN_CONTENT.technology} locale="en" />

      <CTASection
        title="Technology isn’t the argument. It’s the means."
        button="Discover customization"
      />
    </>
  );
}
