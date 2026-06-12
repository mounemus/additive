"use client";

/**
 * Configurateur "Créer ma monture" — portage des principes du plugin
 * WordPress "ADDITIVE Créer mes lunettes" :
 *  - parcours par étapes avec consentement explicite avant tout traitement ;
 *  - questionnaire de style indirect converti en tags esthétiques ;
 *  - 3 concepts maximum, triés par score d'imprimabilité décroissant ;
 *  - estimation TOUJOURS recalculée côté serveur (/api/configurator/estimate) ;
 *  - aucun nom de fournisseur d'IA exposé côté client ;
 *  - architecture prête pour les modules futurs : analyse faciale live,
 *    moodboard génératif, essayage AR, aperçu 3D.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
  ScanFace,
  Camera,
  Box,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STEP_ORDER,
  STEP_LABELS,
  FACE_SHAPES,
  STYLE_QUESTIONS,
  BOLDNESS_LEVELS,
  TAG_LABELS,
  answersToProfile,
  buildConcepts,
  type ConfiguratorStep,
  type FaceShape,
  type Boldness,
  type Concept,
} from "@/lib/configurator";

type Estimate = {
  base: number;
  lens: number;
  finish: number;
  total: number;
  currency: string;
};

const LENS_OPTIONS = [
  { id: "sans-correction", label: "Sans correction", note: "Verres neutres traités anti-reflets" },
  { id: "correction", label: "Correcteurs", note: "Selon votre prescription (+120 $)" },
  { id: "solaire", label: "Solaires", note: "Catégorie 3, protection UV (+80 $)" },
] as const;

const FINISH_OPTIONS = [
  { id: "standard", label: "Satinée standard", note: "Micro-billage uniforme" },
  { id: "premium", label: "Premium polie", note: "Lissage et scellement renforcé (+45 $)" },
] as const;

export function Configurator({ baseModel }: { baseModel?: string }) {
  const [step, setStep] = useState<ConfiguratorStep>("intro");
  const [consent, setConsent] = useState(false);
  const [faceShape, setFaceShape] = useState<FaceShape | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [boldness, setBoldness] = useState<Boldness>("equilibre");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [lensType, setLensType] = useState<(typeof LENS_OPTIONS)[number]["id"]>("sans-correction");
  const [finish, setFinish] = useState<(typeof FINISH_OPTIONS)[number]["id"]>("standard");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const stepIndex = STEP_ORDER.indexOf(step);
  const profile = useMemo(() => answersToProfile(answers), [answers]);
  const concepts = useMemo(
    () => buildConcepts(faceShape, profile, boldness),
    [faceShape, profile, boldness]
  );

  function go(delta: number) {
    const next = STEP_ORDER[Math.min(Math.max(stepIndex + delta, 0), STEP_ORDER.length - 1)];
    setStep(next);
    if (typeof window !== "undefined") {
      document.getElementById("configurateur")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Estimation recalculée côté serveur à chaque variation pertinente.
  useEffect(() => {
    if (step !== "estimate" || !selectedConcept) return;
    let cancelled = false;
    setEstimateLoading(true);
    fetch("/api/configurator/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conceptLabel: selectedConcept.label,
        boldness,
        lensType,
        finish,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setEstimate(data);
      })
      .catch(() => {
        if (!cancelled) setEstimate(null);
      })
      .finally(() => {
        if (!cancelled) setEstimateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, selectedConcept, boldness, lensType, finish]);

  async function submitRequest() {
    setSubmitState("loading");
    try {
      const res = await fetch("/api/customization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          faceShape: faceShape ?? undefined,
          styleTags: profile,
          boldness,
          conceptLabel: selectedConcept?.label,
          conceptSummary: selectedConcept?.summary,
          options: { lensType, finish, ...(baseModel ? { baseModel } : {}) },
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitState("done");
    } catch {
      setSubmitState("error");
    }
  }

  const canContinue =
    (step === "intro") ||
    (step === "consent" && consent) ||
    (step === "morphology" && faceShape !== null) ||
    (step === "style" && Object.keys(answers).length === STYLE_QUESTIONS.length) ||
    step === "recap" ||
    (step === "concepts" && selectedConcept !== null) ||
    step === "estimate";

  return (
    <div id="configurateur" className="scroll-mt-24 rounded-3xl border border-border bg-surface p-6 md:p-12">
      {/* Barre de progression */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <p className="eyebrow">
            Étape {stepIndex + 1} / {STEP_ORDER.length} — {STEP_LABELS[step]}
          </p>
          {baseModel && <Badge variant="blue">Base : {baseModel}</Badge>}
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
                Votre monture ne se choisit plus. Elle se configure.
              </h2>
              <p className="mt-5 leading-relaxed text-muted">
                En quelques minutes, ce parcours traduit votre morphologie et
                votre style en trois concepts de montures imprimables — puis en
                une estimation transparente. Notre atelier prend ensuite le
                relais pour affiner, valider et produire.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-muted">
                <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-accent-blue" /> Aucune donnée traitée sans votre consentement explicite.</li>
                <li className="flex gap-2"><Sparkles className="h-4 w-4 shrink-0 text-accent-blue" /> Trois propositions maximum, jamais une copie du catalogue.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-blue" /> Estimation calculée par notre atelier, sans frais cachés.</li>
              </ul>
            </div>
          )}

          {step === "consent" && (
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Avant de commencer : votre consentement.
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Vos réponses servent uniquement à générer vos concepts et à
                préparer votre demande. Elles ne sont transmises à aucun tiers
                à des fins commerciales, et vous pouvez demander leur
                suppression à tout moment. Lorsque l’analyse faciale par caméra
                sera activée, vos images resteront temporaires et supprimables
                d’un clic — le même principe s’appliquera.
              </p>
              <label className="mt-7 flex cursor-pointer items-start gap-4 rounded-2xl border border-border p-5 transition-colors hover:border-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-5 w-5 accent-[var(--accent-blue)]"
                />
                <span className="text-sm leading-relaxed">
                  J’accepte que mes réponses soient utilisées pour générer mes
                  concepts de montures et préparer ma demande de
                  personnalisation.
                </span>
              </label>
            </div>
          )}

          {step === "morphology" && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Votre morphologie, point de départ du design.
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                Sélectionnez la forme la plus proche de votre visage. L’analyse
                faciale par caméra (mesures millimétriques en temps réel)
                arrive bientôt et affinera automatiquement cette étape.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {FACE_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => setFaceShape(shape.id)}
                    aria-pressed={faceShape === shape.id}
                    className={cn(
                      "rounded-2xl border p-5 text-left transition-all duration-200",
                      faceShape === shape.id
                        ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    <p className="font-display font-semibold">{shape.label}</p>
                    <p className="mt-1 text-xs text-muted">{shape.hint}</p>
                  </button>
                ))}
              </div>
              {faceShape && (
                <p className="mt-6 rounded-xl bg-accent-blue/5 p-4 text-sm text-foreground">
                  <span className="font-medium">Notre lecture : </span>
                  {FACE_SHAPES.find((f) => f.id === faceShape)?.recommendation}
                </p>
              )}
            </div>
          )}

          {step === "style" && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Quelques préférences — pas un interrogatoire.
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                Vos réponses sont converties en signature esthétique. Il n’y a
                aucune bonne réponse.
              </p>
              <div className="mt-8 space-y-10">
                {STYLE_QUESTIONS.map((q, qi) => (
                  <fieldset key={q.id}>
                    <legend className="font-display font-semibold">
                      {qi + 1}. {q.question}
                    </legend>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                          aria-pressed={answers[q.id] === opt.id}
                          className={cn(
                            "rounded-xl border px-5 py-4 text-left text-sm transition-all",
                            answers[q.id] === opt.id
                              ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue"
                              : "border-border hover:border-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}

                <fieldset>
                  <legend className="font-display font-semibold">
                    Et côté audace ?
                  </legend>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {BOLDNESS_LEVELS.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setBoldness(b.id)}
                        aria-pressed={boldness === b.id}
                        className={cn(
                          "rounded-xl border px-5 py-4 text-left transition-all",
                          boldness === b.id
                            ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue"
                            : "border-border hover:border-foreground"
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

          {step === "recap" && (
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Votre profil de design.
              </h2>
              <p className="mt-3 text-muted">
                C’est la matière première de vos concepts. Le moodboard visuel
                généré (planche éditoriale d’inspiration) arrivera avec le
                studio IA.
              </p>
              <div className="mt-8 space-y-5 rounded-2xl border border-border p-7">
                <div>
                  <p className="eyebrow mb-2">Morphologie</p>
                  <p className="font-display text-lg font-semibold">
                    {FACE_SHAPES.find((f) => f.id === faceShape)?.label ?? "Non précisée"}
                  </p>
                </div>
                <div className="hairline" />
                <div>
                  <p className="eyebrow mb-2">Signature esthétique</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.map((tag) => (
                      <Badge key={tag} variant="blue">{TAG_LABELS[tag]}</Badge>
                    ))}
                    <Badge variant="orange">
                      {BOLDNESS_LEVELS.find((b) => b.id === boldness)?.label}
                    </Badge>
                  </div>
                </div>
                {baseModel && (
                  <>
                    <div className="hairline" />
                    <div>
                      <p className="eyebrow mb-2">Modèle de départ</p>
                      <p className="font-display text-lg font-semibold capitalize">{baseModel}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === "concepts" && (
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Trois directions. Pas une de plus.
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                Générées à partir de votre profil et triées par score
                d’imprimabilité. Notre collection existante inspire ces
                directions mais n’est jamais recopiée — votre monture sera la
                vôtre.
              </p>
              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {concepts.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept)}
                    aria-pressed={selectedConcept?.id === concept.id}
                    className={cn(
                      "flex h-full flex-col rounded-2xl border p-6 text-left transition-all",
                      selectedConcept?.id === concept.id
                        ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{concept.label}</h3>
                      <Badge variant="success">{concept.printability}% imprimable</Badge>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                      {concept.summary}
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {concept.designNotes.map((note) => (
                        <li key={note} className="flex gap-2 text-xs text-muted">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-blue" />
                          {note}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 font-display font-semibold">
                      À partir de {concept.basePrice} $ CAD
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "estimate" && selectedConcept && (
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="font-display text-2xl font-bold md:text-3xl">
                  Affinez votre configuration.
                </h2>
                <div className="mt-7 space-y-8">
                  <fieldset>
                    <legend className="font-display font-semibold">Verres</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {LENS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setLensType(opt.id)}
                          aria-pressed={lensType === opt.id}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left transition-all",
                            lensType === opt.id
                              ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue"
                              : "border-border hover:border-foreground"
                          )}
                        >
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="mt-0.5 text-xs text-muted">{opt.note}</p>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="font-display font-semibold">Finition</legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {FINISH_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setFinish(opt.id)}
                          aria-pressed={finish === opt.id}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left transition-all",
                            finish === opt.id
                              ? "border-accent-blue bg-accent-blue/5 ring-1 ring-accent-blue"
                              : "border-border hover:border-foreground"
                          )}
                        >
                          <p className="text-sm font-semibold">{opt.label}</p>
                          <p className="mt-0.5 text-xs text-muted">{opt.note}</p>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>

              <aside className="h-fit rounded-2xl border border-border bg-background p-7 lg:sticky lg:top-28">
                <p className="eyebrow mb-4">Estimation atelier</p>
                {estimateLoading ? (
                  <div className="flex items-center gap-2 text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" /> Calcul en cours…
                  </div>
                ) : estimate ? (
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Concept « {selectedConcept.label} »</dt>
                      <dd className="font-medium">{estimate.base} $</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Verres</dt>
                      <dd className="font-medium">{estimate.lens > 0 ? `${estimate.lens} $` : "Inclus"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Finition</dt>
                      <dd className="font-medium">{estimate.finish > 0 ? `${estimate.finish} $` : "Incluse"}</dd>
                    </div>
                    <div className="hairline !my-4" />
                    <div className="flex justify-between font-display text-xl font-bold">
                      <dt>Total estimé</dt>
                      <dd>{estimate.total} $ {estimate.currency}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted">
                    Estimation momentanément indisponible — vous pourrez tout de
                    même envoyer votre demande, notre atelier vous répondra
                    avec un devis précis.
                  </p>
                )}
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  Estimation indicative, validée par notre atelier avant toute
                  commande. Production et expédition depuis Montréal.
                </p>
              </aside>
            </div>
          )}

          {step === "request" && (
            <div className="max-w-2xl">
              {submitState === "done" ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-accent-blue" />
                  <h2 className="mt-5 font-display text-2xl font-bold md:text-3xl">
                    Votre demande est dans l’atelier.
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-muted">
                    Notre équipe étudie votre profil et votre concept « {selectedConcept?.label} »,
                    puis vous recontacte sous 48 h ouvrables avec une proposition affinée.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold md:text-3xl">
                    Dernière étape : où vous joindre ?
                  </h2>
                  <p className="mt-3 text-muted">
                    Votre profil, votre concept et votre estimation sont joints
                    automatiquement à la demande.
                  </p>
                  <div className="mt-7 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cfg-name">Nom *</Label>
                        <Input
                          id="cfg-name"
                          value={form.name}
                          autoComplete="name"
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cfg-email">Email *</Label>
                        <Input
                          id="cfg-email"
                          type="email"
                          value={form.email}
                          autoComplete="email"
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfg-phone">Téléphone</Label>
                      <Input
                        id="cfg-phone"
                        type="tel"
                        value={form.phone}
                        autoComplete="tel"
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfg-message">Précisions (optionnel)</Label>
                      <Textarea
                        id="cfg-message"
                        rows={4}
                        placeholder="Contraintes, inspirations, prescription…"
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    {submitState === "error" && (
                      <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        L’envoi a échoué. Vérifiez vos coordonnées puis réessayez,
                        ou écrivez-nous à hello@additive.ca.
                      </p>
                    )}
                    <Button
                      size="lg"
                      className="gap-2"
                      disabled={submitState === "loading" || !form.name || !form.email}
                      onClick={submitRequest}
                    >
                      {submitState === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Envoyer ma demande à l’atelier
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step !== "request" && (
        <div className="mt-12 flex items-center justify-between border-t border-border pt-7">
          <Button
            variant="ghost"
            onClick={() => go(-1)}
            disabled={stepIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
          <Button onClick={() => go(1)} disabled={!canContinue} className="gap-2">
            {step === "intro" ? "Commencer" : "Continuer"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modules à venir — architecture prête */}
      <div className="mt-12 rounded-2xl bg-foreground/[0.03] p-6">
        <p className="eyebrow mb-4">Bientôt dans le configurateur</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ScanFace, label: "Analyse faciale live", note: "Mesures millimétriques par caméra, avec consentement et suppression à la demande" },
            { icon: Wand2, label: "Moodboard génératif", note: "Planche d’inspiration éditoriale générée depuis votre profil" },
            { icon: Camera, label: "Essayage AR", note: "Votre concept porté, en temps réel, fidèle au rendu final" },
            { icon: Box, label: "Aperçu 3D", note: "Rotation et zoom sur votre monture avant production" },
          ].map((m) => (
            <div key={m.label} className="flex gap-3">
              <m.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-orange" />
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{m.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
