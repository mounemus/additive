import { Mail, MapPin, Clock } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedText } from "@/components/motion/animated-text";
import { ContactForm } from "@/components/sections/contact-form";
import { buildMetadata } from "@/lib/seo";

// Même politique de rendu que /contact.
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact ADDITIVE: purchase, customization, retail partnership, press or investment. 3D-printed eyewear, Montréal.",
  path: "/en/contact",
  locale: "en",
  alternate: "/contact",
});

export default function EnglishContactPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  return (
    <section className="pb-14 pt-28 md:pt-32">
      <div className="container grid gap-16 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <FadeIn>
            <p className="eyebrow mb-4">Contact</p>
          </FadeIn>
          <AnimatedText
            text="Let’s talk about your next pair."
            className="font-display text-display-md font-bold"
          />
          <FadeIn delay={0.2}>
            <p className="mt-6 leading-relaxed text-muted">
              Purchase, customization, partnership, press or investment:
              every request lands directly in our Montréal workshop.
            </p>
            <div className="mt-8 space-y-6">
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
                  <p className="font-medium">Workshop</p>
                  <p className="text-muted">Montréal, Québec, Canada</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="mt-0.5 h-5 w-5 text-accent-blue" />
                <div>
                  <p className="font-medium">Response</p>
                  <p className="text-muted">Within 48 business hours</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.15}>
          <div className="rounded-3xl border border-border bg-surface p-8 md:p-10">
            <ContactForm defaultType={searchParams.type} locale="en" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
