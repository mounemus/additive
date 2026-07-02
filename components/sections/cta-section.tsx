import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { ExplodedBackdrop } from "@/components/sections/exploded-backdrop";

export function CTASection({
  title,
  button,
  href = "/personnalisation",
  modelUrl,
  withExploded3D = false,
}: {
  title: string;
  button: string;
  href?: string;
  modelUrl?: string;
  withExploded3D?: boolean;
}) {
  return (
    <section className="section-dark relative overflow-hidden py-16 md:py-24">
      {withExploded3D ? (
        <ExplodedBackdrop modelUrl={modelUrl} imageSrc="/images/bg/cta-neutral.png" />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(var(--accent-blue) 1px, transparent 1px), linear-gradient(90deg, var(--accent-blue) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      )}
      <div className="container relative text-center">
        <AnimatedText
          text={title}
          className="mx-auto max-w-4xl text-balance font-display text-display-lg font-bold"
        />
        <FadeIn delay={0.3}>
          <MagneticButton className="mt-8">
            <Link href={href}>
              <Button variant="light" size="lg" className="gap-2">
                {button}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </MagneticButton>
        </FadeIn>
      </div>
    </section>
  );
}
