"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_THEME,
  DEFAULT_MEDIA,
  THEME_FIELDS,
  MEDIA_FIELDS,
  type SiteTheme,
  type SiteMedia,
} from "@/lib/site-config";

type SaveState = "idle" | "saving" | "saved" | "error";

function useSaver(key: string) {
  const router = useRouter();
  const [state, setState] = useState<SaveState>("idle");
  async function save(value: unknown) {
    setState("saving");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      setState("saved");
      router.refresh();
      setTimeout(() => setState("idle"), 1800);
    } else {
      setState("error");
    }
  }
  return { state, save };
}

function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={state === "saving"} size="sm" className="gap-2">
      {state === "saving" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "saved" ? (
        <Check className="h-4 w-4" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {state === "saved" ? "Enregistré" : "Enregistrer"}
    </Button>
  );
}

export function ThemeEditor({ value }: { value: Partial<SiteTheme> }) {
  const [theme, setTheme] = useState<SiteTheme>({ ...DEFAULT_THEME, ...value });
  const { state, save } = useSaver("theme");
  const set = (k: keyof SiteTheme, v: string) => setTheme((t) => ({ ...t, [k]: v }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display font-semibold">Couleurs de marque</h2>
        <button
          type="button"
          onClick={() => setTheme({ ...DEFAULT_THEME })}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
        </button>
      </div>
      <p className="mb-6 text-sm text-muted">
        La palette s’applique à tout le site (boutons, accents, fonds). Aperçu en
        direct ci-dessous ; cliquez sur « Enregistrer » pour publier.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {THEME_FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={`theme-${f.key}`}>{f.label}</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                aria-label={f.label}
              />
              <Input
                id={`theme-${f.key}`}
                value={theme[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="font-mono text-sm uppercase"
              />
            </div>
            <p className="text-xs text-muted">{f.hint}</p>
          </div>
        ))}
      </div>

      {/* Aperçu en direct */}
      <div
        className="mt-6 overflow-hidden rounded-xl border border-border"
        style={{ background: theme.ink }}
      >
        <div className="flex flex-wrap items-center gap-3 p-5">
          <span
            className="rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ background: theme.additiveBlue }}
          >
            Bouton principal
          </span>
          <span
            className="rounded-full px-4 py-2 text-sm font-medium text-white"
            style={{ background: theme.signalOrange }}
          >
            Accent signal
          </span>
          <span className="text-sm" style={{ color: theme.electricBlue }}>
            Lien électrique
          </span>
          <span
            className="ml-auto rounded-md px-3 py-1.5 text-sm"
            style={{ background: theme.paper, color: theme.ink }}
          >
            Surface claire
          </span>
        </div>
      </div>

      <div className="mt-5">
        <SaveButton state={state} onClick={() => save(theme)} />
        {state === "error" && (
          <p className="mt-2 text-sm text-red-600">Sauvegarde impossible (base de données requise).</p>
        )}
      </div>
    </div>
  );
}

export function MediaEditor({ value }: { value: Partial<SiteMedia> }) {
  const [media, setMedia] = useState<SiteMedia>({ ...DEFAULT_MEDIA, ...value });
  const { state, save } = useSaver("media");
  const set = (k: keyof SiteMedia, v: string) => setMedia((m) => ({ ...m, [k]: v }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display font-semibold">Sources média du site</h2>
        <button
          type="button"
          onClick={() => setMedia({ ...DEFAULT_MEDIA })}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
        </button>
      </div>
      <p className="mb-6 text-sm text-muted">
        Collez l’URL d’un média (chemin local <code>/videos/...</code> ou lien
        externe / Cloudinary). Utilisez l’onglet « Médias » pour téléverser, puis
        copiez l’URL ici.
      </p>

      <div className="space-y-5">
        {MEDIA_FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={`media-${f.key}`}>
              {f.label}
              <span className="ml-2 rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                {f.accept}
              </span>
            </Label>
            <Input
              id={`media-${f.key}`}
              value={media[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={DEFAULT_MEDIA[f.key]}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted">{f.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <SaveButton state={state} onClick={() => save(media)} />
        {state === "error" && (
          <p className="mt-2 text-sm text-red-600">Sauvegarde impossible (base de données requise).</p>
        )}
      </div>
    </div>
  );
}
