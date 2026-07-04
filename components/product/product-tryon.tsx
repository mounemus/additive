"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImageDown, Loader2, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaceTryon } from "@/components/configurator/face-tryon";
import type { CatalogProduct } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";

/**
 * Essayage virtuel en direct sur fiche produit (façon Zenni/Fittingbox) :
 * bouton « Essayer sur mon visage » → modale plein écran en 2 étapes
 * (consentement explicite, puis caméra + ancrage MediaPipe via FaceTryon).
 * La façade transparente du produit est générée par /api/configurator/
 * frame-overlay et mémorisée par produit dans sessionStorage.
 */

// Chaînes locales au composant (FR/EN), cohérentes avec la prop `locale`.
const STRINGS = {
  fr: {
    open: "Essayer sur mon visage",
    dialogLabel: "Essayage virtuel",
    close: "Fermer",
    consentTitle: "Nous détectons des points génériques de votre visage — c’est tout !",
    bullets: [
      "Aucune reconnaissance ni identification : seuls des repères anonymes (yeux, tempes) sont détectés.",
      "Aucune image n’est stockée ni partagée — tout reste dans votre navigateur.",
      "La caméra est coupée dès que vous fermez cette fenêtre.",
    ],
    refuse: "Je refuse",
    accept: "J’accepte",
    preparing: "Préparation de la monture…",
    unavailable:
      "La façade exacte du modèle est momentanément indisponible — un aperçu générique sera utilisé.",
    captureAlt: "Aperçu de votre essayage",
    download: "Télécharger",
    retake: "Reprendre",
    width: "Largeur",
    height: "Hauteur",
    adjustHint: "Ajustez si besoin — vue miroir",
    uploadPhoto: "Téléverser une photo",
    uploadedAlt: "Votre photo téléversée",
    portraitTitle: "Votre portrait porté",
    portraitIntro:
      "Générez un portrait photoréaliste vous montrant avec exactement cette monture — votre visage est strictement préservé.",
    portraitCta: "Générer mon portrait",
    portraitPrivacy:
      "Votre photo ne quitte votre navigateur que pour cette génération — elle n’est ni stockée ni réutilisée.",
    portraitLoading:
      "Génération de votre portrait en cours (environ 20 secondes)… Votre visage reste strictement identique, seule la monture est ajoutée.",
    portraitError:
      "La génération du portrait est momentanément indisponible. Réessayez dans quelques instants.",
    portraitAlt: "Portrait photoréaliste avec la monture",
    regenerate: "Régénérer",
  },
  en: {
    open: "Try on my face",
    dialogLabel: "Virtual try-on",
    close: "Close",
    consentTitle: "We detect generic points on your face — that’s all!",
    bullets: [
      "No recognition or identification: only anonymous landmarks (eyes, temples) are detected.",
      "No image is stored or shared — everything stays in your browser.",
      "The camera turns off as soon as you close this window.",
    ],
    refuse: "No thanks",
    accept: "I agree",
    preparing: "Preparing the frame…",
    unavailable:
      "The exact frame for this model is momentarily unavailable — a generic preview will be used.",
    captureAlt: "Preview of your try-on",
    download: "Download",
    retake: "Retake",
    width: "Width",
    height: "Height",
    adjustHint: "Adjust if needed — mirror view",
    uploadPhoto: "Upload a photo",
    uploadedAlt: "Your uploaded photo",
    portraitTitle: "Your worn portrait",
    portraitIntro:
      "Generate a photorealistic portrait showing you with exactly this frame — your face is strictly preserved.",
    portraitCta: "Generate my portrait",
    portraitPrivacy:
      "Your photo only leaves your browser for this generation — it is never stored or reused.",
    portraitLoading:
      "Generating your portrait (about 20 seconds)… Your face stays strictly identical, only the frame is added.",
    portraitError: "Portrait generation is momentarily unavailable. Please try again shortly.",
    portraitAlt: "Photorealistic portrait with the frame",
    regenerate: "Regenerate",
  },
} as const;

type Overlay = { image: string; bg: "transparent" | "white" };

// Hash court (djb2, base36) de l'URL de l'image produit : intégré à la clé
// sessionStorage pour qu'une image changée invalide l'overlay mémorisé.
function shortHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// URL exploitable côté serveur : absolutise l'image produit si relative.
function absoluteImageUrl(raw: string): string | undefined {
  if (!raw) return undefined;
  if (/^(https?:)?\/\//.test(raw) || raw.startsWith("data:")) return raw;
  return `${window.location.origin}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

// Redimensionne une image (data URL) à 1024 px max côté client, en JPEG :
// la photo envoyée au serveur pour le portrait reste légère et normalisée.
function downscaleToJpeg(dataUrl: string, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const w0 = img.naturalWidth || 1;
        const h0 = img.naturalHeight || 1;
        const scale = Math.min(1, maxDim / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * scale));
        const h = Math.max(1, Math.round(h0 * scale));
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        // Fond blanc : les PNG à zones transparentes deviennent un JPEG propre.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function ProductTryon({
  product,
  locale = "fr",
}: {
  product: CatalogProduct;
  locale?: Locale;
}) {
  const s = STRINGS[locale] ?? STRINGS.fr;

  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [capture, setCapture] = useState<string | null>(null);
  // Réglages utilisateur (sliders) : échelle et position verticale de la façade.
  const [widthAdjust, setWidthAdjust] = useState(0);
  const [heightAdjust, setHeightAdjust] = useState(0);
  // Photo téléversée (alternative à la capture caméra) pour le portrait porté.
  const [uploaded, setUploaded] = useState<string | null>(null);
  // Portrait porté photoréaliste généré par /api/configurator/tryon-portrait.
  const [portrait, setPortrait] = useState<string | null>(null);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState(false);
  // Anti-rafale : « Régénérer » désactivé 15 s après chaque clic.
  const [regenCooldown, setRegenCooldown] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const fetchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Compteur de génération : une réponse arrivée après fermeture/reset est ignorée.
  const portraitGenRef = useRef(0);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const close = useCallback(() => {
    // Fermer démonte FaceTryon (rendu conditionnel) → son cleanup coupe la
    // caméra (tracks stoppés). Exigence de confidentialité non négociable.
    // La photo téléversée et le portrait sont aussi purgés : rien ne survit
    // à la fermeture de la fenêtre.
    setOpen(false);
    setCapture(null);
    setUploaded(null);
    setPortrait(null);
    setPortraitError(false);
    setPortraitLoading(false);
    portraitGenRef.current += 1;
  }, []);

  // Échap + verrouillage du scroll + gestion du focus pendant la modale.
  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      // Piège à focus minimal : Tab boucle dans la modale.
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocusRef.current?.focus?.();
    };
  }, [open, close]);

  // Façade du produit : sessionStorage d'abord (clé versionnée
  // tryon.v3.<slug>.<hash image> — v3 = prompt façade avec amorces de
  // charnières ; image produit changée = overlay régénéré), sinon génération
  // via l'API. En cas d'échec (503/429…), overlay reste null et FaceTryon
  // affiche sa façade neutre + un avis — l'essayage reste possible.
  const loadOverlay = useCallback(async () => {
    const key = `tryon.v3.${product.slug}.${shortHash(product.image ?? "")}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<Overlay>;
        if (parsed?.image) {
          setOverlay({
            image: parsed.image,
            bg: parsed.bg === "white" ? "white" : "transparent",
          });
          return;
        }
      }
    } catch {
      // sessionStorage indisponible (navigation privée…) : on régénère.
    }
    setOverlayLoading(true);
    try {
      // L'API exige une URL exploitable côté serveur : absolutise l'image
      // produit si elle est relative (ex. /uploads/….jpg).
      const conceptImage = absoluteImageUrl(product.image || "");
      const res = await fetch("/api/configurator/frame-overlay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptLabel: product.name,
          styleTags: [],
          conceptSummary: product.shortDescription ?? undefined,
          conceptImage,
          // Couleurs/matières réelles du produit → fidélité du prompt serveur.
          colors: product.colors ?? [],
          materials: product.materials ?? [],
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { image: string; bg?: string };
      const next: Overlay = {
        image: data.image,
        bg: data.bg === "white" ? "white" : "transparent",
      };
      setOverlay(next);
      try {
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Quota dépassé (data URL volumineuse) : tant pis pour le cache.
      }
    } catch {
      setOverlay(null);
      fetchedRef.current = false; // autorise une nouvelle tentative plus tard
    } finally {
      setOverlayLoading(false);
    }
  }, [product]);

  const accept = useCallback(() => {
    setConsented(true);
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      void loadOverlay();
    }
  }, [loadOverlay]);

  // ── Portrait porté photoréaliste ───────────────────────────────────────────
  // Photo source : la capture caméra si présente, sinon la photo téléversée.
  const portraitPhoto = capture ?? uploaded;

  // « Téléverser une photo » : lecture locale + redimensionnement 1024 px JPEG.
  const onUploadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-choisir le même fichier
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : null;
      if (!raw) return;
      downscaleToJpeg(raw)
        .then((resized) => {
          setUploaded(resized);
          setPortrait(null);
          setPortraitError(false);
        })
        .catch(() => {});
    };
    reader.readAsDataURL(file);
  }, []);

  // Génération du portrait : la photo (capture ou téléversée) est réduite à
  // 1024 px JPEG côté client, puis envoyée UNIQUEMENT pour cette génération.
  const generatePortrait = useCallback(async () => {
    const source = capture ?? uploaded;
    if (!source || portraitLoading) return;
    const gen = (portraitGenRef.current += 1);
    setPortraitError(false);
    setPortraitLoading(true);
    // Anti-rafale : chaque clic (re)démarre le délai de 15 s sur « Régénérer ».
    setRegenCooldown(true);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => setRegenCooldown(false), 15_000);
    try {
      const photo = await downscaleToJpeg(source);
      const res = await fetch("/api/configurator/tryon-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptLabel: product.name,
          styleTags: [],
          photo,
          conceptImage: absoluteImageUrl(product.image || ""),
          conceptSummary: product.shortDescription ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(String(res.status)); // 503/429… → message générique
      const data = (await res.json()) as { image?: string };
      if (!data.image) throw new Error("empty");
      if (portraitGenRef.current !== gen) return; // modale fermée entre-temps
      setPortrait(data.image);
    } catch {
      if (portraitGenRef.current === gen) setPortraitError(true);
    } finally {
      if (portraitGenRef.current === gen) setPortraitLoading(false);
    }
  }, [capture, uploaded, portraitLoading, product]);

  const step: "consent" | "tryon" = consented ? "tryon" : "consent";

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="mt-3 w-full gap-2 sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <Camera className="h-4 w-4" />
        {s.open}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={s.dialogLabel}
          onClick={close}
        >
          <div
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl sm:p-8"
          >
            <button
              ref={closeBtnRef}
              onClick={close}
              aria-label={s.close}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-foreground transition-colors hover:bg-border"
            >
              <X className="h-5 w-5" />
            </button>

            {step === "consent" ? (
              <div className="pr-10">
                <h2 className="font-display text-xl font-bold leading-snug sm:text-2xl">
                  {s.consentTitle}
                </h2>
                <ul className="mt-6 space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button variant="outline" size="lg" onClick={close}>
                    {s.refuse}
                  </Button>
                  <Button size="lg" onClick={accept}>
                    {s.accept}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-8">
                {overlayLoading && (
                  <p className="mb-4 text-center text-sm text-muted" role="status">
                    {s.preparing}
                  </p>
                )}
                {!overlayLoading && !overlay && (
                  <p className="mb-4 text-center text-xs text-muted" role="status">
                    {s.unavailable}
                  </p>
                )}
                {/* FaceTryon reste monté derrière l'aperçu : « Reprendre »
                    est instantané. Il est démonté (caméra coupée) uniquement
                    à la fermeture de la modale. */}
                <div className={capture ? "hidden" : undefined}>
                  <FaceTryon
                    frameSrc={overlay?.image}
                    frameBg={overlay?.bg}
                    loading={overlayLoading}
                    onCapture={setCapture}
                    locale={locale}
                    widthAdjust={widthAdjust}
                    heightAdjust={heightAdjust}
                  />
                  {/* Réglages discrets : échelle (Largeur) et position (Hauteur)
                      de la façade, appliqués en direct dans le canvas. */}
                  <div className="mx-auto mt-4 grid w-full max-w-xl grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                    <label className="flex items-center gap-3 text-xs text-muted">
                      <span className="w-14 shrink-0">{s.width}</span>
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        step={1}
                        value={widthAdjust}
                        onChange={(e) => setWidthAdjust(Number(e.target.value))}
                        aria-label={s.width}
                        className="h-2 w-full cursor-pointer accent-accent-blue"
                      />
                    </label>
                    <label className="flex items-center gap-3 text-xs text-muted">
                      <span className="w-14 shrink-0">{s.height}</span>
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        step={1}
                        value={heightAdjust}
                        onChange={(e) => setHeightAdjust(Number(e.target.value))}
                        aria-label={s.height}
                        className="h-2 w-full cursor-pointer accent-accent-blue"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-center text-[11px] text-muted">{s.adjustHint}</p>
                  {/* Alternative sans caméra : téléverser une photo pour le
                      portrait porté (lue et réduite localement, jamais stockée). */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {s.uploadPhoto}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUploadFile}
                      aria-label={s.uploadPhoto}
                    />
                  </div>
                </div>
                {capture && (
                  <div>
                    {/* Data URL locale (jamais envoyée au serveur) : <img>
                        suffit, next/image n'apporte rien ici. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capture}
                      alt={s.captureAlt}
                      className="mx-auto w-full max-w-xl rounded-2xl border border-border"
                    />
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <a href={capture} download={`essayage-${product.slug}.jpg`}>
                        <Button className="gap-2">
                          <ImageDown className="h-4 w-4" />
                          {s.download}
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setCapture(null)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        {s.retake}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Votre portrait porté / Your worn portrait ─────────────
                    Visible dès qu'une photo source existe (capture caméra ou
                    photo téléversée). La photo n'est envoyée au serveur QUE
                    pour cette génération. */}
                {portraitPhoto && (
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="font-display text-lg font-bold">{s.portraitTitle}</h3>
                    <p className="mt-2 text-sm text-muted">{s.portraitIntro}</p>

                    {!capture && uploaded && !portrait && (
                      /* Aperçu local de la photo téléversée (jamais envoyée
                         hors génération). */
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={uploaded}
                        alt={s.uploadedAlt}
                        className="mx-auto mt-4 max-h-44 rounded-xl border border-border"
                      />
                    )}

                    {portraitLoading ? (
                      <p
                        className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted"
                        role="status"
                      >
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        {s.portraitLoading}
                      </p>
                    ) : portrait ? (
                      <div className="mt-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={portrait}
                          alt={s.portraitAlt}
                          className="mx-auto w-full max-w-xl rounded-2xl border border-border"
                        />
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                          <a href={portrait} download={`portrait-${product.slug}.jpg`}>
                            <Button className="gap-2">
                              <ImageDown className="h-4 w-4" />
                              {s.download}
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={generatePortrait}
                            disabled={regenCooldown}
                          >
                            <RotateCcw className="h-4 w-4" />
                            {s.regenerate}
                          </Button>
                        </div>
                        <p className="mt-3 text-center text-[11px] text-muted">
                          {s.portraitPrivacy}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4">
                        {portraitError && (
                          <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
                            {s.portraitError}
                          </p>
                        )}
                        <Button
                          className="gap-2"
                          onClick={generatePortrait}
                          disabled={regenCooldown && portraitError}
                        >
                          <Sparkles className="h-4 w-4" />
                          {s.portraitCta}
                        </Button>
                        <p className="mt-2 text-[11px] text-muted">{s.portraitPrivacy}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
