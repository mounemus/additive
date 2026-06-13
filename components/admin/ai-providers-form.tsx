"use client";

import { useState } from "react";
import { Loader2, Save, KeyRound, CheckCircle2, XCircle, FlaskConical, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { IMAGE_TASKS, MODEL_CATALOG } from "@/content/configurator-defaults";

type ProviderStatus = {
  id: string;
  label: string;
  slot: string;
  models: string[];
  keyEnv: string;
  configured: boolean;
  masked: string;
};

type Assignment = { provider: string; model: string };

type Status = {
  tasks: Record<string, Assignment>;
  visionProvider: string;
  providers: ProviderStatus[];
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  stability: "Stability AI",
  replicate: "Replicate",
  demo: "Mode démo (sans IA)",
};

export function AiProvidersForm({ initial }: { initial: Status }) {
  const [providers, setProviders] = useState(initial.providers);
  const [tasks, setTasks] = useState<Record<string, Assignment>>(initial.tasks);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [tests, setTests] = useState<Record<string, { ok: boolean; detail?: string } | "loading">>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setTask(id: string, patch: Partial<Assignment>) {
    setTasks((t) => {
      const next = { ...t[id], ...patch };
      // Si on change de provider, recale le modèle sur le 1er du catalogue.
      if (patch.provider && patch.provider !== "demo") {
        const models = MODEL_CATALOG[patch.provider] ?? [];
        if (!models.some((m) => m.id === next.model)) next.model = models[0]?.id ?? next.model;
      }
      return { ...t, [id]: next };
    });
  }

  async function testKey(id: string) {
    const key = keys[id] || "••••";
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
      body: JSON.stringify({ tasks, keys }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status) {
        setProviders(data.status.providers);
        setTasks(data.status.tasks);
      }
      setKeys({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Clés API */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <KeyRound className="h-4 w-4 text-accent-blue" /> Clés API
        </h2>
        <p className="mt-1 text-sm text-muted">
          Configurez et testez les clés. Jamais exposées côté client.
        </p>
        <div className="mt-5 space-y-3">
          {providers.map((p) => {
            const test = tests[p.id];
            return (
              <div key={p.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-block h-2 w-2 rounded-full", p.configured ? "bg-emerald-500" : "bg-foreground/20")} />
                    <span className="text-sm font-medium">{p.label}</span>
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
                  <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => testKey(p.id)} disabled={test === "loading" || (!keys[p.id] && !p.configured)}>
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
      </div>

      {/* Affectation par tâche */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-accent-blue" /> Fournisseur &amp; modèle par tâche
        </h2>
        <p className="mt-1 text-sm text-muted">
          Routez chaque étape vers le moteur le plus adapté. Conseil : le portrait
          sur OpenAI (édite la vraie photo → identité fiable) ou Gemini ; les
          concepts sur Gemini pour la cohérence avec le moodboard.
        </p>
        <div className="mt-5 space-y-3">
          {IMAGE_TASKS.map((task) => {
            const a = tasks[task.id] ?? { provider: "demo", model: "" };
            const models = MODEL_CATALOG[a.provider] ?? [];
            return (
              <div key={task.id} className="grid items-center gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1.2fr_1fr_1.2fr]">
                <div>
                  <p className="text-sm font-medium">{task.label}</p>
                  <p className="text-xs text-muted">{task.hint}</p>
                </div>
                <Select value={a.provider} onChange={(e) => setTask(task.id, { provider: e.target.value })} className="h-9 text-sm" aria-label={`Fournisseur ${task.label}`}>
                  <option value="demo">Mode démo</option>
                  {task.providers.map((pid) => (
                    <option key={pid} value={pid}>{PROVIDER_LABELS[pid] ?? pid}</option>
                  ))}
                </Select>
                <Select value={a.model} onChange={(e) => setTask(task.id, { model: e.target.value })} disabled={a.provider === "demo" || models.length === 0} className="h-9 text-sm" aria-label={`Modèle ${task.label}`}>
                  {models.length === 0 ? (
                    <option value="">—</option>
                  ) : (
                    models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)
                  )}
                </Select>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Enregistré" : "Enregistrer la configuration IA"}
          </Button>
        </div>
      </div>
    </div>
  );
}
