"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadCartItem, clearCartItem, type CartItem } from "@/lib/cart";

type PublicConfig = {
  currency: string;
  paymentsActive: boolean;
  depositRate: number;
  options: Record<string, { id: string; label: string }[]>;
};

const OPTION_GROUPS: [keyof CartItem["options"] & string, string, string][] = [
  ["material", "Matériau", "materials"],
  ["finish", "Finition", "finishes"],
  ["lensType", "Verres", "lenses"],
  ["delivery", "Livraison", "delivery"],
  ["urgency", "Urgence", "urgency"],
];

/**
 * Panier réel : la configuration validée au configurateur est rechargée depuis
 * le stockage local. Finalisation sur place — envoi à l'atelier, ou paiement
 * d'acompte Stripe quand il est activé. Le prix affiché vient du devis
 * serveur ; le montant débité est de toute façon recalculé côté serveur.
 */
export function CartClient() {
  const [item, setItem] = useState<CartItem | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [state, setState] = useState<"idle" | "sending" | "paying" | "sent" | "error">("idle");

  useEffect(() => {
    setItem(loadCartItem());
    setLoaded(true);
    fetch("/api/configurator/config")
      .then((r) => (r.ok ? r.json() : null))
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  function labelOf(group: string, id: string): string {
    return config?.options?.[group]?.find((o) => o.id === id)?.label ?? id;
  }

  async function sendToAtelier() {
    if (!item) return;
    setState("sending");
    try {
      const res = await fetch("/api/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          styleTags: item.styleTags,
          boldness: item.boldness,
          faceShape: item.faceShape,
          measurements: item.measurements,
          conceptLabel: item.conceptLabel,
          conceptSummary: item.conceptSummary,
          options: item.options,
          message: "Demande envoyée depuis le panier.",
        }),
      });
      if (!res.ok) throw new Error();
      clearCartItem();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  async function payDeposit() {
    if (!item) return;
    setState("paying");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          conceptLabel: item.conceptLabel,
          conceptSummary: item.conceptSummary,
          boldness: item.boldness,
          styleTags: item.styleTags,
          faceShape: item.faceShape,
          measurements: item.measurements,
          options: item.options,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error();
      clearCartItem();
      window.location.href = data.url; // redirection Stripe Checkout
    } catch {
      setState("error");
    }
  }

  const formOk = form.name.trim().length >= 2 && /.+@.+\..+/.test(form.email);
  const deposit =
    item?.quoteTotal && config ? Math.ceil(item.quoteTotal * (config.depositRate || 0.3)) : null;

  if (!loaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div className="container max-w-xl py-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-accent-blue" />
        <h1 className="mt-6 font-display text-3xl font-bold">Demande transmise à l&rsquo;atelier.</h1>
        <p className="mt-4 text-muted">
          Vous recevez un e-mail de confirmation. Réponse sous 48 h ouvrables.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button size="lg">Retour à l&rsquo;accueil</Button>
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container max-w-xl py-10 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border">
          <ShoppingBag className="h-6 w-6 text-accent-blue" />
        </div>
        <h1 className="font-display text-display-md font-bold">Votre panier est vide.</h1>
        <p className="mt-5 leading-relaxed text-muted">
          Configurez une monture sur mesure : votre concept, vos options et votre
          prix vous attendront ici, même si vous fermez la page.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/personnalisation"><Button size="lg">Créer ma monture</Button></Link>
          <Link href="/produits"><Button variant="outline" size="lg">Voir les modèles</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Votre panier</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border p-6">
          <div className="flex items-start gap-5">
            {item.image && (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[#0a0a0a]">
                <Image src={item.image} alt={item.conceptLabel} fill unoptimized className="object-cover" sizes="96px" />
              </div>
            )}
            <div className="min-w-0">
              <p className="eyebrow mb-1">Monture sur mesure</p>
              <h2 className="font-display text-xl font-bold">{item.conceptLabel}</h2>
              {item.conceptSummary && <p className="mt-1 text-sm text-muted">{item.conceptSummary}</p>}
            </div>
          </div>
          <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
            {OPTION_GROUPS.map(([key, label, group]) =>
              item.options[key] ? (
                <div key={key} className="flex justify-between">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">{labelOf(group, item.options[key])}</dd>
                </div>
              ) : null
            )}
            {item.quoteTotal != null && (
              <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold">
                <dt>Total estimé</dt>
                <dd>{item.quoteTotal} $ {item.currency ?? "CAD"}</dd>
              </div>
            )}
          </dl>
          <button
            onClick={() => { clearCartItem(); setItem(null); }}
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" /> Vider le panier
          </button>
        </div>

        <div className="h-fit rounded-2xl border border-border bg-background p-6 lg:sticky lg:top-28">
          <p className="eyebrow mb-4">Finaliser</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cart-name">Nom *</Label>
              <Input id="cart-name" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cart-email">Email *</Label>
              <Input id="cart-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cart-phone">Téléphone</Label>
              <Input id="cart-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {config?.paymentsActive && deposit != null && (
              <Button className="w-full gap-2" size="lg" disabled={!formOk || state !== "idle" && state !== "error"} onClick={payDeposit}>
                {state === "paying" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Payer l&rsquo;acompte — {deposit} $ {item.currency ?? "CAD"}
              </Button>
            )}
            <Button
              variant={config?.paymentsActive ? "outline" : "default"}
              className="w-full gap-2"
              size="lg"
              disabled={!formOk || (state !== "idle" && state !== "error")}
              onClick={sendToAtelier}
            >
              {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer à l&rsquo;atelier sans payer
            </Button>
          </div>
          {state === "error" && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700" role="alert">
              L&rsquo;opération a échoué. Réessayez ou écrivez-nous à hello@additive.ca.
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            {config?.paymentsActive
              ? `L'acompte (${Math.round((config.depositRate || 0.3) * 100)} %) lance la fabrication en priorité ; le solde est réglé à la validation atelier.`
              : "Nous revenons vers vous sous 48 h ouvrables avec la validation atelier et le paiement."}
          </p>
        </div>
      </div>
    </div>
  );
}
