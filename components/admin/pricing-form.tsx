"use client";

import { useState } from "react";
import { Loader2, Save, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PricingConfig } from "@/content/configurator-defaults";

type OptionList = keyof Pick<PricingConfig, "materials" | "finishes" | "lenses" | "delivery" | "urgency">;

const LISTS: { key: OptionList; label: string }[] = [
  { key: "materials", label: "Matériaux" },
  { key: "finishes", label: "Finitions" },
  { key: "lenses", label: "Verres" },
  { key: "delivery", label: "Livraison" },
  { key: "urgency", label: "Urgence" },
];

export function PricingForm({ initial }: { initial: PricingConfig }) {
  const [cfg, setCfg] = useState<PricingConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setOptionPrice(list: OptionList, idx: number, price: number) {
    setCfg((c) => ({
      ...c,
      [list]: c[list].map((o, i) => (i === idx ? { ...o, price } : o)),
    }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/admin/configurator/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError("Sauvegarde impossible (base de données requise).");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 font-display font-semibold">
        <DollarSign className="h-4 w-4 text-accent-blue" /> Grille tarifaire
      </h2>
      <p className="mt-1 text-sm text-muted">
        Prix de base, options, coefficients de complexité et marge. Le devis client
        est toujours recalculé à partir de ces valeurs.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="base">Prix de base ({cfg.currency})</Label>
          <Input id="base" type="number" value={cfg.base} onChange={(e) => setCfg((c) => ({ ...c, base: Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="margin">Marge (%)</Label>
          <Input id="margin" type="number" step="1" value={Math.round(cfg.marginRate * 100)} onChange={(e) => setCfg((c) => ({ ...c, marginRate: Number(e.target.value) / 100 }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Input id="currency" value={cfg.currency} onChange={(e) => setCfg((c) => ({ ...c, currency: e.target.value }))} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {(["low", "medium", "high"] as const).map((k) => (
          <div key={k} className="space-y-2">
            <Label htmlFor={`cx-${k}`}>Complexité {k === "low" ? "faible" : k === "medium" ? "moyenne" : "élevée"} (×)</Label>
            <Input
              id={`cx-${k}`}
              type="number"
              step="0.01"
              value={cfg.complexity[k]}
              onChange={(e) => setCfg((c) => ({ ...c, complexity: { ...c.complexity, [k]: Number(e.target.value) } }))}
            />
          </div>
        ))}
      </div>

      <div className="mt-7 space-y-6">
        {LISTS.map(({ key, label }) => (
          <div key={key}>
            <p className="mb-2 text-sm font-semibold">{label}</p>
            <div className="space-y-2">
              {cfg[key].map((o, i) => (
                <div key={o.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.label}</p>
                    <p className="truncate text-xs text-muted">{o.note}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">+</span>
                    <Input
                      type="number"
                      value={o.price}
                      onChange={(e) => setOptionPrice(key, i, Number(e.target.value))}
                      className="h-9 w-24 text-sm"
                    />
                    <span className="text-xs text-muted">{cfg.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Enregistré" : "Enregistrer la grille"}
        </Button>
      </div>
    </div>
  );
}
