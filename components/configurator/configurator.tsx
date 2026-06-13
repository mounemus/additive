"use client";

/**
 * Configurateur "Créer ma monture" — pipeline complet, portage des principes
 * du plugin WordPress "ADDITIVE Créer mes lunettes" :
 *
 *  1. Consentement explicite (texte admin) + « Supprimer ma photo » permanent.
 *  2. Capture (caméra ou upload).
 *  3. Analyse faciale en direct (MediaPipe 478 landmarks, mesures mm calibrées
 *     iris) → forme du visage + rapport de chausse.
 *  4. Diagnostic de style indirect → profil de tags.
 *  5. Moodboard éditorial (IA si configurée, sinon SVG cohérent).
 *  6. 3 concepts cohérents avec le moodboard, scores d'imprimabilité +
 *     correspondance, meilleurs en tête.
 *  7. Essayage : vue studio (rendu du concept) + essayage caméra superposé +
 *     capture + portrait porté (identité préservée).
 *  8. Prix recalculé serveur + ajout au panier/atelier avec toutes les données.
 *
 * Confidentialité d'abord ; aucun nom de fournisseur d'IA exposé.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Wand2,
  Camera,
  Ruler,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbox } from "@/components/ui/lightbox";
import { FaceScanner, type ScanResult } from "@/components/configurator/face-scanner";
import { FaceTryon } from "@/components/configurator/face-tryon";
import { cn } from "@/lib/utils";
import {
  STEP_ORDER,
  STEP_LABELS,
  STYLE_QUESTIONS,
  BOLDNESS_LEVELS,
  FACE_SHAPES,
  TAG_LABELS,
  answersToProfile,
  type ConfiguratorStep,
  type Boldness,
  type StyleTag,
} from "@/lib/configurator";
import { MEASUREMENT_LABELS, type FaceMeasurements } from "@/lib/face/face-analysis";

type PublicConfig = {
  consent: { title: string; body: string; checkbox: string; privacyNote: string };
  aiActive: boolean;
  currency: string;
  options: Record<"materials" | "finishes" | "lenses" | "delivery" | "urgency", { id: string; label: string; note: string }[]>;
};

type EnrichedConcept = {
  id: string;
  label: string;
  summary: string;
  designNotes: string[];
  printability: number;
  matchRate: number;
  basePrice: number;
  image: string;
  ai: boolean;
  tags: StyleTag[];
};

type AnalysisReport = {
  faceShapeLabel: string;
  recommendation: string;
  advise: string[];
  avoid: string[];
  chasse: { frameWidth: string; bridge: string; note: string };
};

type Quote = {
  base: number;
  material: number;
  finish: number;
  lens: number;
  delivery: number;
  urgency: number;
  complexityCoef: number;
  margin: number;
  total: number;
  currency: string;
};

export function Configurator({ baseModel }: { baseModel?: string }) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [step, setStep] = useState<ConfiguratorStep>("intro");
  const [consent, setConsent] = useState(false);

  // Morphologie
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  // Style
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [boldness, setBoldness] = useState<Boldness>("equilibre");

  // Moodboard / concepts
  const [moodboard, setMoodboard] = useState<{ image: string; ai: boolean; palette: { name: string; colors: string[]; material: string } } | null>(null);
  const [moodboardLoading, setMoodboardLoading] = useState(false);
  const [concepts, setConcepts] = useState<EnrichedConcept[]>([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [selected, setSelected] = useState<EnrichedConcept | null>(null);

  // Essayage
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [tryonMode, setTryonMode] = useState<"studio" | "live">("studio");
  const [overlay, setOverlay] = useState<{ image: string; bg: "transparent" | "white" } | null>(null);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const overlayForRef = useRef<string | null>(null);

  // Devis
  const [opts, setOpts] = useState({
    material: "pa12-standard",
    finish: "standard",
    lensType: "sans-correction",
    delivery: "standard",
    urgency: "none",
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Demande
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [attachPhoto, setAttachPhoto] = useState(true);

  const [lightbox, setLightbox] = useState<string | null>(null);
  const moodboardDone = useRef(false);
  const conceptsDone = useRef(false);

  const stepIndex = STEP_ORDER.indexOf(step);
  const profile = useMemo(() => answersToProfile(answers), [answers]);

  // Une photo existe-t-elle quelque part ? (pilote « Supprimer ma photo »)
  const hasPhoto = Boolean(scan?.photoDataUrl || snapshot || portrait);

  // ── Chargement de la config publique ──────────────────────────────────────
  useEffect(() => {
    fetch("/api/configurator/config")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  function go(delta: number) {
    const next = STEP_ORDER[Math.min(Math.max(stepIndex + delta, 0), STEP_ORDER.length - 1)];
    setStep(next);
    if (typeof window !== "undefined") {
      document.getElementById("configurateur")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ── Analyse : rapport de chausse après scan ───────────────────────────────
  const onScanComplete = useCallback((result: ScanResult) => {
    setScan(result);
    fetch("/api/configurator/analysis-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ measurements: result.measurements ?? {}, faceShape: result.faceShape }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setReport(data))
      .catch(() => setReport(null));
    setStep("analysis");
  }, []);

  // ── Moodboard (à l'entrée de l'étape) ─────────────────────────────────────
  useEffect(() => {
    if (step !== "moodboard" || moodboardDone.current || !profile.length) return;
    moodboardDone.current = true;
    setMoodboardLoading(true);
    fetch("/api/configurator/moodboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleTags: profile, faceShape: scan?.faceShape }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMoodboard)
      .catch(() => setMoodboard(null))
      .finally(() => setMoodboardLoading(false));
  }, [step, profile, scan]);

  // ── Concepts (génération + régénération) ──────────────────────────────────
  const loadConcepts = useCallback(() => {
    if (!profile.length) return;
    conceptsDone.current = true;
    setConceptsLoading(true);
    setSelected(null);
    fetch("/api/configurator/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        styleTags: profile,
        faceShape: scan?.faceShape,
        boldness,
        moodboardImage: moodboard?.ai ? moodboard.image : undefined,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setConcepts(data.concepts ?? []))
      .catch(() => setConcepts([]))
      .finally(() => setConceptsLoading(false));
  }, [profile, scan, boldness, moodboard]);

  useEffect(() => {
    if (step === "concepts" && !conceptsDone.current) loadConcepts();
  }, [step, loadConcepts]);

  // Changer de concept réinitialise le portrait (régénérable pour le nouveau).
  useEffect(() => {
    setPortrait(null);
    setPortraitError(null);
  }, [selected?.id]);

  // ── Devis (recalculé serveur à chaque variation) ──────────────────────────
  useEffect(() => {
    if (step !== "quote" || !selected) return;
    let cancelled = false;
    setQuoteLoading(true);
    fetch("/api/configurator/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptLabel: selected.label, boldness, ...opts }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => !cancelled && setQuote(data))
      .catch(() => !cancelled && setQuote(null))
      .finally(() => !cancelled && setQuoteLoading(false));
    return () => {
      cancelled = true;
    };
  }, [step, selected, boldness, opts]);

  // ── Façade pour l'essayage AR — PRÉ-générée dès le choix du concept ───────
  // (lancée tôt pour qu'elle soit prête quand l'utilisateur atteint l'essayage)
  useEffect(() => {
    if (!selected) return;
    if (overlayForRef.current === selected.id) return;
    overlayForRef.current = selected.id;
    setOverlay(null);
    setOverlayLoading(true);
    fetch("/api/configurator/frame-overlay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptLabel: selected.label, styleTags: profile, conceptImage: selected.image }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setOverlay({ image: data.image, bg: data.bg }))
      .catch(() => setOverlay(null)) // repli : FaceTryon utilise une façade neutre
      .finally(() => setOverlayLoading(false));
  }, [selected, profile]);

  // ── Suppression des photos (confidentialité) ──────────────────────────────
  function deletePhotos() {
    setScan((s) => (s ? { ...s, photoDataUrl: null } : s));
    setSnapshot(null);
    setPortrait(null);
  }

  // ── Portrait porté ────────────────────────────────────────────────────────
  function generatePortrait() {
    const photo = snapshot || scan?.photoDataUrl;
    if (!photo || !selected) return;
    setPortraitLoading(true);
    setPortraitError(null);
    fetch("/api/configurator/tryon-portrait", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptLabel: selected.label,
        styleTags: profile,
        photo,
        conceptImage: selected.image,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setPortrait(data.image))
      .catch(() => setPortraitError("La génération du portrait est momentanément indisponible. Utilisez l'essayage caméra ci-dessus."))
      .finally(() => setPortraitLoading(false));
  }

  // ── Soumission (ajout au panier / atelier) ────────────────────────────────
  async function submit() {
    setSubmitState("loading");
    try {
      let photoToken: string | undefined;
      const photoToAttach = portrait || snapshot || scan?.photoDataUrl;
      if (attachPhoto && photoToAttach) {
        const pr = await fetch("/api/configurator/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl: photoToAttach, kind: portrait ? "portrait" : "snapshot" }),
        });
        if (pr.ok) photoToken = (await pr.json()).token;
      }
      const res = await fetch("/api/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          faceShape: scan?.faceShape,
          measurements: scan?.measurements ?? undefined,
          analysisReport: report ?? undefined,
          styleTags: profile,
          boldness,
          conceptLabel: selected?.label,
          conceptSummary: selected?.summary,
          conceptData: selected ?? undefined,
          matchRate: selected?.matchRate,
          moodboardUrl: moodboard?.ai ? undefined : moodboard?.image,
          options: opts,
          photoToken,
          ...(baseModel ? { message: `${form.message}\n[base: ${baseModel}]` } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitState("done");
    } catch {
      setSubmitState("error");
    }
  }

  const canContinue =
    step === "intro" ||
    (step === "consent" && consent) ||
    (step === "capture" && scan !== null) ||
    step === "analysis" ||
    (step === "style" && Object.keys(answers).length === STYLE_QUESTIONS.length) ||
    (step === "moodboard" && moodboard !== null) ||
    (step === "concepts" && selected !== null) ||
    step === "tryon" ||
    step === "quote";

  if (!config) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-border bg-surface p-16 text-muted">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement du configurateur…
      </div>
    );
  }

  return (
    <div id="configurateur" className="scroll-mt-24 rounded-3xl border border-border bg-surface p-6 md:p-12">
      {/* Barre de progression + bouton suppression photo permanent */}
      <div className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">
            Étape {stepIndex + 1} / {STEP_ORDER.length} — {STEP_LABELS[step]}
          </p>
          <div className="flex items-center gap-3">
            {baseModel && <Badge variant="blue">Base : {baseModel}</Badge>}
            {hasPhoto && (
              <button
                onClick={deletePhotos}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-red-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> Supprimer ma photo
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="h-full bg-accent-blue"
            animate={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === "intro" && (
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Votre monture ne se choisit plus. Elle se génère pour vous.
              </h2>
              <p className="mt-5 leading-relaxed text-muted">
                Ce parcours analyse votre morphologie, lit votre style, compose un
                moodboard puis génère trois concepts de montures imprimables —
                que vous pouvez essayer en direct avant d'ajuster matière, finition
                et prix.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted">
                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-accent-blue" /> Analyse faciale dans votre navigateur, sans transfert d'image.</li>
                <li className="flex gap-2"><Sparkles className="h-4 w-4 shrink-0 text-accent-blue" /> Trois concepts maximum, jamais une copie du catalogue.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-blue" /> Prix calculé par notre atelier, sans frais cachés.</li>
              </ul>
            </div>
          )}

          {step === "consent" && (
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold md:text-3xl">{config.consent.title}</h2>
              <p className="mt-4 leading-relaxed text-muted">{config.consent.body}</p>
              <label className="mt-7 flex cursor-pointer items-start gap-4 rounded-2xl border border-border p-5 transition-colors hover:border-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-[var(--accent-blue)]"
                />
                <span className="text-sm leading-relaxed">{config.consent.checkbox}</span>
              </label>
              <p className="mt-4 flex gap-2 text-xs text-muted">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent-blue" />
                {config.consent.privacyNote}
              </p>
            </div>
          )}

          {step === "capture" && (
            <div>
              <h2 className="mb-2 font-display text-2xl font-bold md:text-3xl">Capturez votre visage</h2>
              <p className="mb-8 max-w-2xl text-muted">
                Activez votre caméra pour une analyse en direct, ou téléversez une
                photo de face. L'analyse se fait localement.
              </p>
              <FaceScanner onComplete={onScanComplete} />
            </div>
          )}

          {step === "analysis" && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Votre morphologie analysée</h2>
              <p className="mt-3 max-w-2xl text-muted">
                468 points de repère posés sur votre visage, mesures calibrées sur
                votre iris.
              </p>
              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-5 rounded-2xl border border-border p-6">
                  <div>
                    <p className="eyebrow mb-2">Forme du visage</p>
                    <p className="font-display text-2xl font-bold">
                      {report?.faceShapeLabel ?? FACE_SHAPES.find((f) => f.id === scan?.faceShape)?.label}
                    </p>
                    {report?.recommendation && (
                      <p className="mt-2 text-sm text-muted">{report.recommendation}</p>
                    )}
                  </div>
                  {scan?.measurements && (
                    <>
                      <div className="hairline" />
                      <div>
                        <p className="eyebrow mb-3 flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" /> Mesures (mm)</p>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          {(Object.keys(scan.measurements) as (keyof FaceMeasurements)[]).map((k) => (
                            <div key={k} className="flex justify-between gap-2 rounded-lg bg-foreground/[0.03] px-3 py-1.5">
                              <dt className="text-muted">{MEASUREMENT_LABELS[k]}</dt>
                              <dd className="font-medium">{scan.measurements![k]}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-5">
                  {report && (
                    <div className="rounded-2xl border border-border p-6">
                      <p className="eyebrow mb-3">Recommandations de chausse</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />{report.chasse.frameWidth}</li>
                        <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />{report.chasse.bridge}</li>
                        <li className="flex gap-2 text-muted">{report.chasse.note}</li>
                      </ul>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-emerald-600">À privilégier</p>
                          <ul className="mt-1 space-y-1 text-xs text-muted">
                            {report.advise.map((a) => <li key={a}>· {a}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-amber-600">À éviter</p>
                          <ul className="mt-1 space-y-1 text-xs text-muted">
                            {report.avoid.map((a) => <li key={a}>· {a}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  {scan?.photoDataUrl && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={scan.photoDataUrl} alt="Votre capture" className="h-full w-full -scale-x-100 object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "style" && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Quelques préférences — pas un test.</h2>
              <p className="mt-3 max-w-2xl text-muted">Vos réponses composent votre signature esthétique. Aucune bonne réponse.</p>
              <div className="mt-8 space-y-10">
                {STYLE_QUESTIONS.map((q, qi) => (
                  <fieldset key={q.id}>
                    <legend className="font-display font-semibold">{qi + 1}. {q.question}</legend>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                          aria-pressed={answers[q.id] === opt.id}
                          className={cn(
                            "rounded-xl border px-5 py-4 text-left text-sm transition-all",
                            answers[q.id] === opt.id ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue" : "border-border hover:border-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <fieldset>
                  <legend className="font-display font-semibold">Et côté audace ?</legend>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {BOLDNESS_LEVELS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBoldness(b.id)}
                        aria-pressed={boldness === b.id}
                        className={cn(
                          "rounded-xl border px-5 py-4 text-left transition-all",
                          boldness === b.id ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue" : "border-border hover:border-foreground"
                        )}
                      >
                        <p className="text-sm font-semibold">{b.label}</p>
                        <p className="mt-1 text-xs text-muted">{b.description}</p>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>
          )}

          {step === "moodboard" && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Votre moodboard</h2>
              <p className="mt-3 max-w-2xl text-muted">
                Une planche d'ambiance composée à partir de votre profil : palette,
                matières, textures lattice. Elle guide la cohérence de vos concepts.
              </p>
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  {moodboardLoading ? (
                    <div className="flex aspect-[3/2] items-center justify-center rounded-2xl border border-border bg-foreground/[0.03] text-muted">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Composition du moodboard…
                    </div>
                  ) : moodboard ? (
                    <button
                      onClick={() => setLightbox(moodboard.image)}
                      className="group relative block aspect-[3/2] w-full overflow-hidden rounded-2xl border border-border"
                    >
                      <Image src={moodboard.image} alt="Moodboard" fill unoptimized className="object-cover transition-transform group-hover:scale-105" sizes="(max-width:1024px) 100vw, 60vw" />
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">Agrandir</span>
                    </button>
                  ) : null}
                </div>
                {moodboard && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-border p-6">
                      <p className="eyebrow mb-3">Palette — {moodboard.palette.name}</p>
                      <div className="flex gap-2">
                        {moodboard.palette.colors.map((c) => (
                          <div key={c} className="flex-1">
                            <div className="h-12 rounded-lg ring-1 ring-black/10" style={{ backgroundColor: c }} />
                            <p className="mt-1 text-center text-[10px] text-muted">{c}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-muted">Matière : {moodboard.palette.material}</p>
                    </div>
                    <div className="rounded-2xl border border-border p-6">
                      <p className="eyebrow mb-3">Signature</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.map((t) => <Badge key={t} variant="blue">{TAG_LABELS[t]}</Badge>)}
                        <Badge variant="orange">{BOLDNESS_LEVELS.find((b) => b.id === boldness)?.label}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "concepts" && (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">Trois concepts pour vous</h2>
                  <p className="mt-3 max-w-2xl text-muted">
                    Générés à partir de votre moodboard et de votre morphologie, triés
                    par taux de correspondance. La collection existante inspire, sans
                    jamais être recopiée.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={loadConcepts} disabled={conceptsLoading}>
                  <RefreshCw className={cn("h-4 w-4", conceptsLoading && "animate-spin")} /> Régénérer
                </Button>
              </div>
              {conceptsLoading ? (
                <div className="mt-8 flex items-center justify-center rounded-2xl border border-border bg-foreground/[0.03] p-16 text-muted">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Génération de vos concepts…
                </div>
              ) : (
                <div className="mt-8 grid gap-5 lg:grid-cols-3">
                  {concepts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      aria-pressed={selected?.id === c.id}
                      className={cn(
                        "flex h-full flex-col overflow-hidden rounded-2xl border text-left transition-all",
                        selected?.id === c.id ? "border-accent-blue ring-2 ring-accent-blue" : "border-border hover:border-foreground"
                      )}
                    >
                      <div className="relative aspect-square bg-[#0a0a0a]">
                        <Image src={c.image} alt={c.label} fill unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 33vw" />
                        <span className="absolute left-3 top-3 rounded-full bg-accent-blue px-2.5 py-1 text-xs font-medium text-white">{c.matchRate}% match</span>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-lg font-bold">{c.label}</h3>
                          <Badge variant="success">{c.printability}% impr.</Badge>
                        </div>
                        <p className="mt-2 flex-1 text-sm text-muted">{c.summary}</p>
                        <p className="mt-4 font-display font-semibold">À partir de {c.basePrice} $ CAD</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "tryon" && selected && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">Essayez « {selected.label} »</h2>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setTryonMode("studio")} className={cn("rounded-full px-4 py-1.5 text-sm", tryonMode === "studio" ? "bg-foreground text-background" : "border border-border text-muted")}>Vue studio</button>
                <button onClick={() => setTryonMode("live")} className={cn("rounded-full px-4 py-1.5 text-sm", tryonMode === "live" ? "bg-foreground text-background" : "border border-border text-muted")}>Essayage caméra</button>
              </div>

              <div className="mt-6 grid gap-8 lg:grid-cols-2">
                <div>
                  {tryonMode === "studio" ? (
                    <button onClick={() => setLightbox(selected.image)} className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
                      <Image src={selected.image} alt={selected.label} fill unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
                    </button>
                  ) : (
                    <FaceTryon
                      frameSrc={overlay?.image}
                      frameBg={overlay?.bg}
                      loading={overlayLoading}
                      onCapture={(d) => setSnapshot(d)}
                    />
                  )}
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-border p-6">
                    <p className="eyebrow mb-2">Votre portrait porté</p>
                    <p className="text-sm text-muted">
                      Générez un portrait photoréaliste vous montrant avec exactement
                      cette monture — votre visage est strictement préservé.
                    </p>
                    {portrait ? (
                      <>
                        <button onClick={() => setLightbox(portrait)} className="relative mt-4 block aspect-square w-full overflow-hidden rounded-xl border border-border">
                          <Image src={portrait} alt="Portrait porté" fill unoptimized className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
                        </button>
                        <Button variant="outline" size="sm" onClick={generatePortrait} disabled={portraitLoading} className="mt-3 gap-2">
                          <RefreshCw className={cn("h-4 w-4", portraitLoading && "animate-spin")} /> Régénérer le portrait
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={generatePortrait}
                        disabled={portraitLoading || (!snapshot && !scan?.photoDataUrl)}
                        className="mt-4 gap-2"
                      >
                        {portraitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Générer mon portrait
                      </Button>
                    )}
                    {!snapshot && !scan?.photoDataUrl && (
                      <p className="mt-2 text-xs text-muted">Capturez d'abord un essayage ou une photo.</p>
                    )}
                    {portraitError && <p className="mt-2 text-xs text-amber-600">{portraitError}</p>}
                  </div>

                  {snapshot && (
                    <div className="rounded-2xl border border-border p-4">
                      <p className="eyebrow mb-2 flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> Essayage capturé</p>
                      <button onClick={() => setLightbox(snapshot)} className="relative block aspect-video w-full overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={snapshot} alt="Essayage capturé" className="h-full w-full object-cover" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "quote" && selected && (
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="font-display text-2xl font-bold md:text-3xl">Matière, finition, options</h2>
                <div className="mt-7 space-y-7">
                  {([
                    ["material", "Matériau", config.options.materials],
                    ["finish", "Finition", config.options.finishes],
                    ["lensType", "Verres", config.options.lenses],
                    ["delivery", "Livraison", config.options.delivery],
                    ["urgency", "Urgence", config.options.urgency],
                  ] as const).map(([key, label, list]) => (
                    <fieldset key={key}>
                      <legend className="font-display text-sm font-semibold">{label}</legend>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {list.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => setOpts((s) => ({ ...s, [key]: o.id }))}
                            aria-pressed={opts[key] === o.id}
                            className={cn(
                              "rounded-xl border px-4 py-3 text-left transition-all",
                              opts[key] === o.id ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue" : "border-border hover:border-foreground"
                            )}
                          >
                            <p className="text-sm font-semibold">{o.label}</p>
                            <p className="mt-0.5 text-xs text-muted">{o.note}</p>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </div>

              <aside className="h-fit rounded-2xl border border-border bg-background p-7 lg:sticky lg:top-28">
                <p className="eyebrow mb-4">Devis atelier</p>
                {quoteLoading ? (
                  <div className="flex items-center gap-2 text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Calcul…</div>
                ) : quote ? (
                  <dl className="space-y-2.5 text-sm">
                    <Row label={`Concept « ${selected.label} »`} value={`${quote.base} $`} />
                    {quote.complexityCoef !== 1 && <Row label={`Complexité ×${quote.complexityCoef}`} value="" muted />}
                    <Row label="Matériau" value={quote.material > 0 ? `${quote.material} $` : "Inclus"} />
                    <Row label="Finition" value={quote.finish > 0 ? `${quote.finish} $` : "Incluse"} />
                    <Row label="Verres" value={quote.lens > 0 ? `${quote.lens} $` : "Inclus"} />
                    <Row label="Livraison" value={quote.delivery > 0 ? `${quote.delivery} $` : "Incluse"} />
                    {quote.urgency > 0 && <Row label="Urgence" value={`${quote.urgency} $`} />}
                    <div className="hairline !my-4" />
                    <div className="flex justify-between font-display text-xl font-bold">
                      <dt>Total estimé</dt>
                      <dd>{quote.total} $ {quote.currency}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted">Estimation indisponible — vous pourrez tout de même envoyer votre demande.</p>
                )}
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  Prix recalculé côté serveur à chaque option. Validé par l'atelier avant production.
                </p>
              </aside>
            </div>
          )}

          {step === "request" && (
            <div className="max-w-2xl">
              {submitState === "done" ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-accent-blue" />
                  <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">Ajouté au panier atelier.</h2>
                  <p className="mx-auto mt-3 max-w-md text-muted">
                    Votre configuration « {selected?.label} » — morphologie, profil,
                    concept{quote ? ` et estimation (${quote.total} $ CAD)` : ""} — est
                    transmise à notre atelier montréalais. Nous vous recontactons sous
                    48 h ouvrables.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">Finaliser votre demande</h2>
                  <p className="mt-3 text-muted">
                    Toutes les données utiles (analyse, profil, concept, options
                    {quote ? `, prix ${quote.total} $ CAD` : ""}) sont jointes pour l'atelier.
                  </p>
                  <div className="mt-7 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cfg-name">Nom *</Label>
                        <Input id="cfg-name" value={form.name} autoComplete="name" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cfg-email">Email *</Label>
                        <Input id="cfg-email" type="email" value={form.email} autoComplete="email" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfg-phone">Téléphone</Label>
                      <Input id="cfg-phone" type="tel" value={form.phone} autoComplete="tel" onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfg-message">Précisions (optionnel)</Label>
                      <Textarea id="cfg-message" rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Prescription, contraintes, inspirations…" />
                    </div>
                    {(portrait || snapshot || scan?.photoDataUrl) && (
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                        <input type="checkbox" checked={attachPhoto} onChange={(e) => setAttachPhoto(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent-blue)]" />
                        <span className="text-sm text-muted">
                          Joindre ma photo d'essayage à la demande (temporaire, supprimable). Décochez pour ne rien transmettre.
                        </span>
                      </label>
                    )}
                    {submitState === "error" && (
                      <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">L'envoi a échoué. Réessayez ou écrivez-nous à hello@additive.ca.</p>
                    )}
                    <Button size="lg" className="gap-2" disabled={submitState === "loading" || !form.name || !form.email} onClick={submit}>
                      {submitState === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Ajouter au panier atelier
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step !== "request" && (
        <div className="mt-12 flex items-center justify-between border-t border-border pt-7">
          <Button variant="ghost" onClick={() => go(-1)} disabled={stepIndex === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <Button onClick={() => go(1)} disabled={!canContinue} className="gap-2">
            {step === "intro" ? "Commencer" : step === "tryon" ? "Voir le prix" : "Continuer"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Lightbox src={lightbox} alt="Aperçu" open={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={muted ? "text-xs text-muted" : "text-muted"}>{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
