"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Wand2, Camera, Sparkles, CheckCircle2, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lightbox } from "@/components/ui/lightbox";
import { ModulairPreview } from "@/components/configurator/modulair-preview";
import { FaceTryon } from "@/components/configurator/face-tryon";
import { FaceScanner, type ScanResult } from "@/components/configurator/face-scanner";
import { cn, formatPrice } from "@/lib/utils";
import {
  FACE_SHAPES_MOD,
  MODULAIR_DEFAULT_CONFIG,
  DEFAULT_SELECTION,
  selectionSummaryFr,
  colorOf,
  type ModulairSelection,
  type ModulairConfig,
  type ModColor,
} from "@/lib/modulair";

type Quote = {
  base: number;
  branches: number;
  verres: number;
  finish: number;
  bicolor: number;
  total: number;
  currency: string;
};

const LABEL = "MODUL’AIR sur-mesure";

export function ModulairConfigurator() {
  const [sel, setSel] = useState<ModulairSelection>(DEFAULT_SELECTION);
  const [cfg, setCfg] = useState<ModulairConfig>(MODULAIR_DEFAULT_CONFIG);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tab, setTab] = useState<"preview" | "render" | "ar">("preview");

  const [render, setRender] = useState<string | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const [overlay, setOverlay] = useState<{ image: string; bg: "transparent" | "white" } | null>(null);
  const [overlayLoading, setOverlayLoading] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submit, setSubmit] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const summary = useMemo(() => selectionSummaryFr(sel), [sel]);
  const selKey = JSON.stringify(sel);

  // Config administrable (libellés + prix des éléments de combinaison).
  useEffect(() => {
    fetch("/api/configurator/modulair-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCfg(d))
      .catch(() => {});
  }, []);

  function set<K extends keyof ModulairSelection>(k: K, v: ModulairSelection[K]) {
    setSel((s) => ({ ...s, [k]: v }));
  }

  // Devis serveur à chaque changement.
  useEffect(() => {
    let cancel = false;
    fetch("/api/configurator/modulair-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: selKey,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancel && setQuote(d))
      .catch(() => !cancel && setQuote(null));
    return () => {
      cancel = true;
    };
  }, [selKey]);

  // Changer la combinaison invalide le rendu/overlay/portrait précédents.
  useEffect(() => {
    setRender(null);
    setOverlay(null);
    setPortrait(null);
    setPortraitError(null);
  }, [selKey]);

  const generateRender = useCallback(() => {
    setRenderLoading(true);
    fetch("/api/configurator/modulair-render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: selKey,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setRender(d.image);
        setTab("render");
        // Pré-génère la façade AR conditionnée sur le rendu.
        setOverlayLoading(true);
        return fetch("/api/configurator/frame-overlay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conceptLabel: LABEL, conceptSummary: summary, conceptImage: d.image, styleTags: [] }),
        });
      })
      .then((r) => (r && r.ok ? r.json() : null))
      .then((d) => d && setOverlay({ image: d.image, bg: d.bg }))
      .catch(() => setRender(null))
      .finally(() => {
        setRenderLoading(false);
        setOverlayLoading(false);
      });
  }, [selKey, summary]);

  const generatePortrait = useCallback(() => {
    if (!photo) return;
    setPortraitLoading(true);
    setPortraitError(null);
    fetch("/api/configurator/tryon-portrait", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptLabel: LABEL, conceptSummary: summary, photo, conceptImage: render ?? undefined, styleTags: [] }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setPortrait(d.image))
      .catch(() => setPortraitError("Génération momentanément indisponible. Utilisez l’essayage AR ci-dessus."))
      .finally(() => setPortraitLoading(false));
  }, [photo, render, summary]);

  function onScan(r: ScanResult) {
    if (r.photoDataUrl) setPhoto(r.photoDataUrl);
  }

  async function addToAtelier() {
    setSubmit("loading");
    try {
      let photoToken: string | undefined;
      const toAttach = portrait || photo;
      if (toAttach) {
        const pr = await fetch("/api/configurator/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl: toAttach, kind: portrait ? "portrait" : "capture" }),
        });
        if (pr.ok) photoToken = (await pr.json()).token;
      }
      const res = await fetch("/api/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          conceptLabel: LABEL,
          conceptSummary: summary,
          conceptData: sel,
          moodboardUrl: render ?? undefined,
          options: sel,
          photoToken,
          message: `${form.message}\n[MODUL'AIR] ${summary}`,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmit("done");
    } catch {
      setSubmit("error");
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 md:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* ── Visualisation ─────────────────────────────────────────────── */}
        <div>
          <div className="mb-4 flex gap-2">
            {[
              { id: "preview", label: "Aperçu" },
              { id: "render", label: "Rendu studio" },
              { id: "ar", label: "Essayage AR" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition-colors",
                  tab === t.id ? "bg-foreground text-background" : "border border-border text-muted hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "preview" && (
            <motion.div key={selKey} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }}>
              <ModulairPreview selection={sel} className="aspect-[2/1] w-full" />
            </motion.div>
          )}

          {tab === "render" && (
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
              {render ? (
                <button onClick={() => setLightbox(render)} className="block h-full w-full">
                  <Image src={render} alt="Rendu studio" fill unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
                </button>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white/60">
                  <Sparkles className="h-8 w-8" />
                  <p className="text-sm">Génère un rendu studio photoréaliste de ta combinaison.</p>
                  <Button onClick={generateRender} disabled={renderLoading} variant="light" className="gap-2">
                    {renderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Générer le rendu
                  </Button>
                </div>
              )}
              {render && (
                <Button onClick={generateRender} disabled={renderLoading} variant="light" size="sm" className="absolute bottom-3 right-3 gap-2">
                  <RefreshCw className={cn("h-3.5 w-3.5", renderLoading && "animate-spin")} /> Régénérer
                </Button>
              )}
            </div>
          )}

          {tab === "ar" && (
            <FaceTryon frameSrc={overlay?.image} frameBg={overlay?.bg} loading={overlayLoading} onCapture={(d) => setPhoto(d)} />
          )}

          <p className="mt-4 text-sm text-muted">{summary}</p>
        </div>

        {/* ── Configuration ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Selector label="Forme de la face" options={FACE_SHAPES_MOD} value={sel.faceShape} onChange={(v) => set("faceShape", v as ModulairSelection["faceShape"])} />
          <Swatches label="Couleur de la face" colors={cfg.colors} value={sel.faceColor} onChange={(v) => set("faceColor", v)} />
          <Selector label="Branches" options={cfg.branchStyles} value={sel.branchStyle} onChange={(v) => set("branchStyle", v as ModulairSelection["branchStyle"])} />
          <Swatches label="Couleur des branches" colors={cfg.colors} value={sel.branchColor} onChange={(v) => set("branchColor", v)} />
          <Selector label="Verres" options={cfg.verres} value={sel.verre} onChange={(v) => set("verre", v as ModulairSelection["verre"])} />
          <Selector label="Finition" options={cfg.finishes} value={sel.finish} onChange={(v) => set("finish", v as ModulairSelection["finish"])} />

          {quote && (
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Prix estimé (atelier)</span>
                <span className="font-display text-2xl font-bold">{formatPrice(quote.total, quote.currency)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Base {quote.base} + branches {quote.branches} + verres {quote.verres} + finition {quote.finish}
                {quote.bicolor ? ` + bicolore ${quote.bicolor}` : ""} $ · recalculé côté serveur.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Portrait porté + atelier ──────────────────────────────────────── */}
      <div className="mt-10 grid gap-8 border-t border-border pt-10 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Camera className="h-5 w-5 text-accent-blue" /> Votre portrait porté
          </h3>
          <p className="mt-2 text-sm text-muted">
            Capturez une photo, puis générez un portrait photoréaliste vous montrant avec votre combinaison — visage strictement préservé.
          </p>
          {!photo ? (
            <div className="mt-5">
              <FaceScanner onComplete={onScan} />
            </div>
          ) : portrait ? (
            <div className="mt-5 space-y-3">
              <button onClick={() => setLightbox(portrait)} className="relative block aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-border">
                <Image src={portrait} alt="Portrait porté" fill unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
              </button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={generatePortrait} disabled={portraitLoading} className="gap-2">
                  <RefreshCw className={cn("h-4 w-4", portraitLoading && "animate-spin")} /> Régénérer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setPhoto(null); setPortrait(null); }}>Nouvelle photo</Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-emerald-600"><CheckCircle2 className="mr-1 inline h-4 w-4" /> Photo prête.</p>
              <Button onClick={generatePortrait} disabled={portraitLoading} className="gap-2">
                {portraitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Générer mon portrait porté
              </Button>
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => setPhoto(null)}>Reprendre</Button>
              {portraitError && <p className="text-xs text-amber-600">{portraitError}</p>}
            </div>
          )}
        </div>

        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Layers className="h-5 w-5 text-accent-blue" /> Ajouter à l’atelier
          </h3>
          {submit === "done" ? (
            <div className="mt-5 rounded-2xl border border-border bg-background p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-accent-blue" />
              <p className="mt-3 font-display font-semibold">Votre combinaison est dans l’atelier.</p>
              <p className="mt-1 text-sm text-muted">Nous revenons vers vous sous 48 h ouvrables avec un devis affiné.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="m-name">Nom *</Label>
                  <Input id="m-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-email">Email *</Label>
                  <Input id="m-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-phone">Téléphone</Label>
                <Input id="m-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              {submit === "error" && <p className="text-sm text-red-600">Échec de l’envoi. Réessayez ou écrivez à hello@additive.ca.</p>}
              <Button size="lg" className="gap-2" disabled={submit === "loading" || !form.name || !form.email} onClick={addToAtelier}>
                {submit === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                Ajouter ma combinaison au panier atelier
              </Button>
              <Badge variant="muted">{quote ? formatPrice(quote.total, quote.currency) : ""} · {summary}</Badge>
            </div>
          )}
        </div>
      </div>

      <Lightbox src={lightbox} alt="Aperçu" open={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: string; label: string; hint?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            title={o.hint}
            className={cn(
              "rounded-xl border px-3 py-2 text-left text-xs transition-all",
              value === o.id ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue" : "border-border hover:border-foreground"
            )}
          >
            <span className="font-medium">{o.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Swatches({ label, colors, value, onChange }: { label: string; colors: ModColor[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label} — {colorOf(value, colors).label}</legend>
      <div className="flex gap-2.5">
        {colors.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            aria-label={c.label}
            aria-pressed={value === c.id}
            className={cn(
              "h-9 w-9 rounded-full ring-1 ring-black/10 transition-all",
              value === c.id && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </fieldset>
  );
}
