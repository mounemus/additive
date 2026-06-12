"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Éditeur de contenus éditoriaux (SiteContent).
 * Les champs texte simples sont édités directement ; les structures
 * (listes, sections) sont éditées en JSON avec validation à la sauvegarde.
 */
export function ContentEditor({
  contentKey,
  title,
  description,
  value,
}: {
  contentKey: string;
  title: string;
  description: string;
  value: unknown;
}) {
  const router = useRouter();
  const isStructured = typeof value !== "string";
  const [draft, setDraft] = useState(() =>
    isStructured ? JSON.stringify(value, null, 2) : String(value ?? "")
  );
  const [fields, setFields] = useState<Record<string, string> | null>(() => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.values(value).every((v) => typeof v === "string")
    ) {
      return value as Record<string, string>;
    }
    return null;
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setState("saving");
    setError(null);
    let payload: unknown;
    if (fields) {
      payload = fields;
    } else if (isStructured) {
      try {
        payload = JSON.parse(draft);
      } catch {
        setError("JSON invalide — vérifiez la syntaxe.");
        setState("error");
        return;
      }
    } else {
      payload = draft;
    }
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: contentKey, value: payload }),
    });
    if (res.ok) {
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 1800);
    } else {
      setError("Sauvegarde impossible (base de données requise).");
      setState("error");
    }
  }

  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between p-6">
        <div>
          <h2 className="font-display font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
        <span className="text-xs text-muted transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="space-y-4 border-t border-border p-6">
        {fields ? (
          Object.entries(fields).map(([k, v]) => (
            <div key={k} className="space-y-2">
              <Label htmlFor={`${contentKey}-${k}`} className="capitalize">
                {k}
              </Label>
              {v.length > 80 ? (
                <Textarea
                  id={`${contentKey}-${k}`}
                  rows={3}
                  value={v}
                  onChange={(e) => setFields((f) => ({ ...f!, [k]: e.target.value }))}
                />
              ) : (
                <Input
                  id={`${contentKey}-${k}`}
                  value={v}
                  onChange={(e) => setFields((f) => ({ ...f!, [k]: e.target.value }))}
                />
              )}
            </div>
          ))
        ) : (
          <Textarea
            rows={Math.min(20, Math.max(6, draft.split("\n").length))}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="font-mono text-xs"
            aria-label={`Contenu ${title}`}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={save} disabled={state === "saving"} size="sm" className="gap-2">
          {state === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === "saved" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {state === "saved" ? "Enregistré" : "Enregistrer"}
        </Button>
      </div>
    </details>
  );
}
