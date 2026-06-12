import { Mail, MapPin, Clock } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ContactForm } from "@/components/sections/contact-form";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contactez ADDITIVE : achat, personnalisation, partenariat détaillant, presse ou investissement. Lunetterie imprimée en 3D, Montréal.",
  path: "/contact",
});

export default function ContactPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  return (
    <section className="pb-24 pt-36 md:pt-44">
      <div className="container grid gap-16 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <FadeIn>
            <p className="eyebrow mb-4">Contact</p>
          </FadeIn>
          <AnimatedText
            text="Parlons de votre prochaine paire."
            className="font-display text-display-md font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 leading-relaxed text-muted">
              Achat, personnalisation, partenariat, presse ou investissement :
              chaque demande arrive directement dans notre atelier montréalais.
            </p>
            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 h-5 w-5 text-accent-blue" />
                <div>
                  <p className="font-medium">Email</p>
                  <a
                    href="mailto:hello@additive.ca"
                    className="text-muted underline-offset-4 hover:underline"
                  >
                    hello@additive.ca
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-0.5 h-5 w-5 text-accent-blue" />
                <div>
                  <p className="font-medium">Atelier</p>
                  <p className="text-muted">Montréal, Québec, Canada</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="mt-0.5 h-5 w-5 text-accent-blue" />
                <div>
                  <p className="font-medium">Réponse</p>
                  <p className="text-muted">Sous 48 h ouvrables</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <div className="rounded-3xl border border-border bg-surface p-8 md:p-10">
            <ContactForm defaultType={searchParams.type} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
