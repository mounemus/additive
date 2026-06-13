"use client";

import { useState } from "react";
import { Loader2, Save, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModulairConfig, ModOption } from "@/lib/modulair";

type ListKey = "branchStyles" | "verres" | "finishes";
const LISTS: { key: ListKey; label: string }[] = [
  { key: "branchStyles", label: "Branches" },
  { key: "verres", label: "Verres" },
  { key: "finishes", label: "Finitions" },
];

export function ModulairConfigForm({ initial }: { initial: ModulairConfig }) {
  const [cfg, setCfg] = useState<ModulairConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setOption(list: ListKey, idx: number, patch: Partial<ModOption>) {
    setCfg((c) => ({ ...c, [list]: c[list].map((o, i) => (i === idx ? { ...o, ...patch } : o)) }));
  }
  function setColor(idx: number, patch: Partial<{ label: string; hex: string }>) {
    setCfg((c) => ({ ...c, colors: c.colors.map((o, i) => (i === idx ? { ...o, ...patch } : o)) }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/admin/configurator/modulair", {
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
        <Layers className="h-4 w-4 text-accent-blue" /> MODUL’AIR — éléments de combinaison
      </h2>
      <p className="mt-1 text-sm text-muted">
        Prix de base, surcoût bicolore, et libellés/prix des branches, verres,
        finitions et couleurs du configurateur « Moduler mes lunettes ». (Les
        formes de face sont géométriques et définies dans le code.)
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="mod-base">Prix de base ({cfg.currency})</Label>
          <Input id="mod-base" type="number" value={cfg.base} onChange={(e) => setCfg((c) => ({ ...c, base: Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mod-bicolor">Surcoût bicolore</Label>
          <Input id="mod-bicolor" type="number" value={cfg.bicolor} onChange={(e) => setCfg((c) => ({ ...c, bicolor: Number(e.target.value) }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mod-currency">Devise</Label>
          <Input id="mod-currency" value={cfg.currency} onChange={(e) => setCfg((c) => ({ ...c, currency: e.target.value }))} />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {LISTS.map(({ key, label }) => (
          <div key={key}>
            <p className="mb-2 text-sm font-semibold">{label}</p>
            <div className="space-y-2">
              {cfg[key].map((o, i) => (
                <div key={o.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <code className="w-28 shrink-0 truncate text-xs text-muted">{o.id}</code>
                  <Input value={o.label} onChange={(e) => setOption(key, i, { label: e.target.value })} className="h-9 flex-1 text-sm" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">+</span>
                    <Input type="number" value={o.price} onChange={(e) => setOption(key, i, { price: Number(e.target.value) })} className="h-9 w-24 text-sm" />
                    <span className="text-xs text-muted">{cfg.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="mb-2 text-sm font-semibold">Couleurs</p>
          <div className="flex flex-wrap gap-2">
            {cfg.colors.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
                <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} className="h-7 w-7 cursor-pointer rounded" aria-label={`Couleur ${c.label}`} />
                <Input value={c.label} onChange={(e) => setColor(i, { label: e.target.value })} className="h-8 w-24 text-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Enregistré" : "Enregistrer la config MODUL’AIR"}
        </Button>
      </div>
    </div>
  );
}
