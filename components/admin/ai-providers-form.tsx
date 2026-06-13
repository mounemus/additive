"use client";

import { useState } from "react";
import { Loader2, Save, KeyRound, CheckCircle2, XCircle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ProviderStatus = {
  id: string;
  label: string;
  slot: string;
  models: string[];
  keyEnv: string;
  configured: boolean;
  masked: string;
};

type Status = {
  imageProvider: string;
  imageModel: string;
  visionProvider: string;
  providers: ProviderStatus[];
};

export function AiProvidersForm({ initial }: { initial: Status }) {
  const [status, setStatus] = useState<Status>(initial);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, { ok: boolean; detail?: string } | "loading">>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const imageProviders = status.providers.filter((p) => p.slot === "image");
  const activeImage = status.providers.find((p) => p.id === status.imageProvider);

  async function testKey(id: string) {
    const key = keys[id] || "••••"; // "••••" → teste la clé enregistrée
    setTests((t) => ({ ...t, [id]: "loading" }));
    const res = await fetch("/api/admin/configurator/providers/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId: id, key }),
    });
    const data = await res.json().catch(() => ({ ok: false }));
    setTests((t) => ({ ...t, [id]: data }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/configurator/providers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageProvider: status.imageProvider,
        imageModel: status.imageModel,
        visionProvider: status.visionProvider,
        keys,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status) setStatus(data.status);
      setKeys({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="flex items-center gap-2 font-display font-semibold">
        <KeyRound className="h-4 w-4 text-accent-blue" /> Fournisseurs IA
      </h2>
      <p className="mt-1 text-sm text-muted">
        Configurez et testez les clés. Aucune clé n'est jamais exposée côté client ;
        la génération bascule en mode démo si rien n'est configuré.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="imageProvider">Fournisseur d'images actif</Label>
          <Select
            id="imageProvider"
            value={status.imageProvider}
            onChange={(e) => setStatus((s) => ({ ...s, imageProvider: e.target.value }))}
          >
            <option value="demo">Mode démo (SVG, sans IA)</option>
            {imageProviders.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageModel">Modèle</Label>
          <Select
            id="imageModel"
            value={status.imageModel}
            onChange={(e) => setStatus((s) => ({ ...s, imageModel: e.target.value }))}
            disabled={status.imageProvider === "demo"}
          >
            {(activeImage?.models ?? ["gpt-image-1"]).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {status.providers.map((p) => {
          const test = tests[p.id];
          return (
            <div key={p.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-block h-2 w-2 rounded-full", p.configured ? "bg-emerald-500" : "bg-foreground/20")} />
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="text-xs text-muted">({p.slot})</span>
                </div>
                <span className="text-xs text-muted">env : {p.keyEnv}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  type="password"
                  placeholder={p.configured ? `Clé enregistrée ${p.masked}` : "Coller une clé API"}
                  value={keys[p.id] ?? ""}
                  onChange={(e) => setKeys((k) => ({ ...k, [p.id]: e.target.value }))}
                  className="h-9 max-w-xs text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={() => testKey(p.id)}
                  disabled={test === "loading" || (!keys[p.id] && !p.configured)}
                >
                  {test === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
                  Tester
                </Button>
                {test && test !== "loading" && (
                  <span className={cn("inline-flex items-center gap-1 text-xs", test.ok ? "text-emerald-600" : "text-red-600")}>
                    {test.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {test.detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Enregistré" : "Enregistrer les fournisseurs"}
        </Button>
      </div>
    </div>
  );
}
