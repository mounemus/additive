import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { MagneticButton } from "@/components/motion/magnetic-button";

export function CTASection({
  title,
  button,
  href = "/personnalisation",
}: {
  title: string;
  button: string;
  href?: string;
}) {
  return (
    <section className="section-dark relative overflow-hidden py-28 md:py-40">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--accent-blue) 1px, transparent 1px), linear-gradient(90deg, var(--accent-blue) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="container relative text-center">
        <AnimatedText
          text={title}
          className="mx-auto max-w-4xl text-balance font-display text-display-lg font-bold"
        />
        <FadeIn delay={0.3}>
          <MagneticButton className="mt-12">
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
