"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Database, Sparkles, Inbox, ImageIcon, RefreshCw, Loader2 } from "lucide-react";

type Health = {
  database: boolean;
  imageGeneration: boolean;
  activeImageProvider: string;
  pendingRequests: number;
  tempPhotos: number;
  timestamp: string;
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
  );
}

export function SystemHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/configurator/health")
      .then((r) => (r.ok ? r.json() : null))
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => refresh(), [refresh]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <Activity className="h-4 w-4 text-accent-blue" /> Santé du système
        </h2>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground" disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Rafraîchir
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl bg-foreground/[0.03] px-4 py-3">
          <span className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-muted" /> Base de données</span>
          <Dot ok={!!health?.database} />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-foreground/[0.03] px-4 py-3">
          <span className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-muted" /> Génération IA</span>
          <span className="flex items-center gap-2 text-xs text-muted">
            {health?.imageGeneration ? health.activeImageProvider : "démo"} <Dot ok={!!health?.imageGeneration} />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-foreground/[0.03] px-4 py-3">
          <span className="flex items-center gap-2 text-sm"><Inbox className="h-4 w-4 text-muted" /> Demandes à traiter</span>
          <span className="font-display font-bold">{health?.pendingRequests ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-foreground/[0.03] px-4 py-3">
          <span className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4 text-muted" /> Photos temporaires</span>
          <span className="font-display font-bold">{health?.tempPhotos ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}
