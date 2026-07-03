"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { contactSchema, type ContactInput } from "@/lib/validations";
import type { Locale } from "@/lib/i18n";

/**
 * Libellés du formulaire par locale. Les `value` restent les identifiants FR
 * historiques (contrat de l'API /api/contact et du back-office).
 */
const FORM_COPY = {
  fr: {
    types: [
      { value: "achat", label: "Achat / commande" },
      { value: "personnalisation", label: "Personnalisation" },
      { value: "partenariat", label: "Partenariat / détaillant" },
      { value: "presse", label: "Presse" },
      { value: "investisseur", label: "Investisseur" },
      { value: "autre", label: "Autre demande" },
    ],
    successTitle: "Message envoyé.",
    successBody: "Merci ! Notre équipe vous répond généralement sous 48 h ouvrables.",
    name: "Nom *",
    email: "Email *",
    phone: "Téléphone",
    type: "Type de demande *",
    message: "Message *",
    placeholder: "Parlez-nous de votre projet, de votre style, de vos besoins…",
    error:
      "L’envoi a échoué. Réessayez dans un instant ou écrivez-nous directement à hello@additive.ca.",
    submit: "Envoyer le message",
  },
  en: {
    types: [
      { value: "achat", label: "Purchase / order" },
      { value: "personnalisation", label: "Customization" },
      { value: "partenariat", label: "Partnership / retailer" },
      { value: "presse", label: "Press" },
      { value: "investisseur", label: "Investor" },
      { value: "autre", label: "Other request" },
    ],
    successTitle: "Message sent.",
    successBody: "Thank you! Our team usually replies within 48 business hours.",
    name: "Name *",
    email: "Email *",
    phone: "Phone",
    type: "Request type *",
    message: "Message *",
    placeholder: "Tell us about your project, your style, your needs…",
    error:
      "Sending failed. Try again in a moment, or write to us directly at hello@additive.ca.",
    submit: "Send the message",
  },
} satisfies Record<Locale, unknown>;

export function ContactForm({
  defaultType,
  locale = "fr",
}: {
  defaultType?: string;
  locale?: Locale;
}) {
  const copy = FORM_COPY[locale];
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: copy.types.some((t) => t.value === defaultType)
        ? (defaultType as ContactInput["type"])
        : "achat",
    },
  });

  async function onSubmit(data: ContactInput) {
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent-blue" />
        <h3 className="mt-4 font-display text-xl font-semibold">
          {copy.successTitle}
        </h3>
        <p className="mt-2 text-muted">{copy.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{copy.name}</Label>
          <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{copy.email}</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{copy.phone}</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">{copy.type}</Label>
          <Select id="type" {...register("type")}>
            {copy.types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{copy.message}</Label>
        <Textarea
          id="message"
          rows={6}
          placeholder={copy.placeholder}
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        {errors.message && <p className="text-sm text-red-600">{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{copy.error}</p>
      )}

      <Button type="submit" size="lg" disabled={status === "loading"} className="gap-2">
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {copy.submit}
      </Button>
    </form>
  );
}
