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

const REQUEST_TYPES = [
  { value: "achat", label: "Achat / commande" },
  { value: "personnalisation", label: "Personnalisation" },
  { value: "partenariat", label: "Partenariat / détaillant" },
  { value: "presse", label: "Presse" },
  { value: "investisseur", label: "Investisseur" },
  { value: "autre", label: "Autre demande" },
];

export function ContactForm({ defaultType }: { defaultType?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: REQUEST_TYPES.some((t) => t.value === defaultType)
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
          Message envoyé.
        </h3>
        <p className="mt-2 text-muted">
          Merci ! Notre équipe vous répond généralement sous 48 h ouvrables.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type de demande *</Label>
          <Select id="type" {...register("type")}>
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          rows={6}
          placeholder="Parlez-nous de votre projet, de votre style, de vos besoins…"
          {...register("message")}
          aria-invalid={!!errors.message}
        />
        {errors.message && <p className="text-sm text-red-600">{errors.message.message}</p>}
      </div>

      {status === "error" && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          L’envoi a échoué. Réessayez dans un instant ou écrivez-nous
          directement à hello@additive.ca.
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "loading"} className="gap-2">
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        Envoyer le message
      </Button>
    </form>
  );
}
