"use client";

import { withBase } from "@/lib/base-path";
import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export function NewsletterForm({ locale = "fr" }: { locale?: Locale }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch(withBase("/api/newsletter"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 text-sm text-accent-blue">
        <Check className="h-4 w-4" /> {t("footer.newsletter.done", locale)}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm items-center gap-2 border-b border-border pb-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("footer.newsletter.placeholder", locale)}
        aria-label={t("footer.newsletter.aria.email", locale)}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        aria-label={t("footer.newsletter.aria.submit", locale)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
