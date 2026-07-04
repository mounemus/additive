"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImageDown, Loader2, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FaceTryon,
  NEUTRAL_FRAME,
  computeFrameAnchor,
  drawFrameOverlay,
  extractPose,
  loadImage,
  prepareFrame,
  type PoseAngles,
} from "@/components/configurator/face-tryon";
import { getImageLandmarker } from "@/lib/face/mediapipe";
import { Tryon3DLive, Tryon3DPhoto } from "@/components/product/tryon-3d";
import { colorHex } from "@/components/product/color-dots";
import type { CatalogProduct } from "@/lib/catalog";
import type { Locale } from "@/lib/i18n";

/**
 * Essayage virtuel sur fiche produit (façon Zenni/Fittingbox) :
 * bouton « Essayer sur mon visage » → modale plein écran en 2 étapes
 * (consentement explicite, puis deux onglets : « En direct » — caméra +
 * ancrage MediaPipe via FaceTryon — et « Sur photo » — photo téléversée,
 * détection unique et façade ancrée dans un canvas statique).
 * La façade transparente du produit est générée par /api/configurator/
 * frame-overlay et mémorisée par produit dans sessionStorage.
 *
 * Si le produit possède un modèle 3D (product.model3dUrl), l'essayage passe
 * en WebGL Three.js (Tryon3DLive / Tryon3DPhoto) : le GLB ENTIER (façade +
 * branches) suit la pose 3D du visage avec occlusion crânienne, et des
 * pastilles de couleurs recolorent le modèle en direct. Toute erreur
 * (WebGL, GLB, contexte perdu) rebascule automatiquement sur l'essayage 2D.
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
    adjustHintPhoto: "Ajustez si besoin",
    tabLive: "En direct",
    tabPhoto: "Sur photo",
    photoIntro: "Téléversez une photo de face, bien éclairée, pour essayer la monture.",
    changePhoto: "Changer de photo",
    analyzing: "Analyse de la photo…",
    noFace: "Aucun visage détecté — essayez une photo de face, bien éclairée.",
    photoAlt: "Essayage de la monture sur votre photo",
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
    colorsLabel: "Coloris",
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
    adjustHintPhoto: "Adjust if needed",
    tabLive: "Live",
    tabPhoto: "On photo",
    photoIntro: "Upload a well-lit, front-facing photo to try the frame on.",
    changePhoto: "Change photo",
    analyzing: "Analyzing your photo…",
    noFace: "No face detected — try a well-lit, front-facing photo.",
    photoAlt: "Frame try-on over your photo",
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
    colorsLabel: "Colors",
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
  selectedColor = null,
  onColorChange,
}: {
  product: CatalogProduct;
  locale?: Locale;
  /** Coloris sélectionné sur la fiche (synchronisé avec l'essayage 3D). */
  selectedColor?: string | null;
  /** Remonte le choix fait dans l'essayage 3D vers la fiche produit. */
  onColorChange?: (color: string) => void;
}) {
  const s = STRINGS[locale] ?? STRINGS.fr;

  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  // Onglet actif : essayage caméra en direct, ou essayage statique sur photo.
  const [mode, setMode] = useState<"live" | "photo">("live");
  // Essayage 3D : actif si le produit a un GLB et que WebGL/GLB n'a pas échoué.
  const [threeFailed, setThreeFailed] = useState(false);
  const use3d = Boolean(product.model3dUrl) && !threeFailed;
  // Coloris choisi DANS l'essayage (pastilles) — sinon celui de la fiche.
  const [tryonColor, setTryonColor] = useState<string | null>(null);
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
  // tryon.v4.<slug>.<hash image> — v4 = prompt façade sans départs de
  // branches, plaquettes/pont couleur monture ; image produit changée =
  // overlay régénéré), sinon génération via l'API. En cas d'échec (503/429…),
  // overlay reste null et FaceTryon affiche sa façade neutre + un avis —
  // l'essayage reste possible.
  const loadOverlay = useCallback(async () => {
    const key = `tryon.v4.${product.slug}.${shortHash(product.image ?? "")}`;
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
  }, []);

  // Façade 2D : générée UNIQUEMENT quand l'essayage 2D sert (pas de GLB, ou
  // repli après un échec 3D) — aucun appel image inutile en mode 3D.
  useEffect(() => {
    if (!open || !consented || use3d || fetchedRef.current) return;
    fetchedRef.current = true;
    void loadOverlay();
  }, [open, consented, use3d, loadOverlay]);

  // Échec WebGL/GLB/contexte : bascule automatique et définitive vers le 2D.
  const fail3d = useCallback(() => setThreeFailed(true), []);

  // Coloris effectif de la monture 3D : le choix fait dans l'essayage prime ;
  // sinon la sélection de la fiche, mais seulement si elle diffère du coloris
  // par défaut (le GLB représente déjà le coloris par défaut — ne pas écraser
  // ses textures sans raison). Hex inconnu → matériaux d'origine.
  const activeColorName = tryonColor ?? selectedColor;
  const frameColorHex = tryonColor
    ? colorHex(tryonColor)
    : selectedColor && selectedColor !== (product.colors[0] ?? null)
      ? colorHex(selectedColor)
      : null;

  const pickColor = useCallback(
    (c: string) => {
      setTryonColor(c);
      onColorChange?.(c);
    },
    [onColorChange]
  );

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

  // Réglages Largeur/Hauteur partagés entre les deux onglets (mêmes états :
  // le réglage trouvé en direct reste valable sur photo, et inversement).
  const renderSliders = (hint: string) => (
    <>
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
      <p className="mt-2 text-center text-[11px] text-muted">{hint}</p>
    </>
  );

  // Pastilles de couleurs sous la vue d'essayage 3D (barre style Zenni) :
  // recolore le modèle GLB en direct et synchronise la sélection de la fiche.
  const renderColorBar = () =>
    use3d && product.colors.length > 0 ? (
      <div
        className="mx-auto mt-4 flex w-full max-w-xl items-center justify-center gap-3"
        role="radiogroup"
        aria-label={s.colorsLabel}
      >
        {product.colors.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={activeColorName === c}
            aria-label={`${s.colorsLabel} : ${c}`}
            title={c}
            onClick={() => pickColor(c)}
            className={`h-8 w-8 rounded-full ring-1 ring-black/10 transition-all ${
              activeColorName === c
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : "hover:scale-110"
            }`}
            style={{ backgroundColor: colorHex(c) ?? "#cccccc" }}
          />
        ))}
      </div>
    ) : null;

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
                {/* Onglets « En direct » / « Sur photo » (façon Zenni). */}
                <div className="mb-4 flex justify-center" role="tablist" aria-label={s.dialogLabel}>
                  <div className="inline-flex rounded-full border border-border bg-surface p-1">
                    {(
                      [
                        ["live", s.tabLive],
                        ["photo", s.tabPhoto],
                      ] as const
                    ).map(([m, label]) => (
                      <button
                        key={m}
                        role="tab"
                        aria-selected={mode === m}
                        onClick={() => setMode(m)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                          mode === m
                            ? "bg-foreground text-background"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Avis façade 2D : sans objet quand le GLB 3D est utilisé. */}
                {!use3d && overlayLoading && (
                  <p className="mb-4 text-center text-sm text-muted" role="status">
                    {s.preparing}
                  </p>
                )}
                {!use3d && !overlayLoading && !overlay && (
                  <p className="mb-4 text-center text-xs text-muted" role="status">
                    {s.unavailable}
                  </p>
                )}
                {/* Entrée fichier partagée (onglet photo) : lecture locale +
                    redimensionnement 1024 px JPEG, jamais stockée. */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUploadFile}
                  aria-label={s.uploadPhoto}
                />
                {mode === "photo" ? (
                  /* ── Onglet « Sur photo » : essayage statique sur photo ── */
                  !uploaded ? (
                    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-12">
                      <Upload className="h-10 w-10 text-muted" />
                      <p className="max-w-sm text-center text-sm text-muted">{s.photoIntro}</p>
                      <Button className="gap-2" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4" />
                        {s.uploadPhoto}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {use3d ? (
                        /* Photo + GLB entier : une détection, une pose, un rendu. */
                        <Tryon3DPhoto
                          photo={uploaded}
                          modelUrl={product.model3dUrl!}
                          frameColor={frameColorHex}
                          widthAdjust={widthAdjust}
                          heightAdjust={heightAdjust}
                          locale={locale}
                          slug={product.slug}
                          onFatal={fail3d}
                        />
                      ) : (
                        <PhotoTryon
                          photo={uploaded}
                          frameSrc={overlay?.image}
                          frameBg={overlay?.bg}
                          widthAdjust={widthAdjust}
                          heightAdjust={heightAdjust}
                          locale={locale}
                          slug={product.slug}
                        />
                      )}
                      {renderColorBar()}
                      {renderSliders(s.adjustHintPhoto)}
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {s.changePhoto}
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {/* FaceTryon reste monté derrière l'aperçu : « Reprendre »
                        est instantané. Il est démonté (caméra coupée) à la
                        fermeture de la modale ou au passage à l'onglet photo. */}
                    <div className={capture ? "hidden" : undefined}>
                      {use3d ? (
                        /* Essayage 3D WebGL : GLB entier (façade + branches),
                           occlusion crânienne, capture composite identique. */
                        <Tryon3DLive
                          modelUrl={product.model3dUrl!}
                          frameColor={frameColorHex}
                          onCapture={setCapture}
                          onFatal={fail3d}
                          locale={locale}
                          widthAdjust={widthAdjust}
                          heightAdjust={heightAdjust}
                        />
                      ) : (
                        <FaceTryon
                          frameSrc={overlay?.image}
                          frameBg={overlay?.bg}
                          loading={overlayLoading}
                          onCapture={setCapture}
                          locale={locale}
                          widthAdjust={widthAdjust}
                          heightAdjust={heightAdjust}
                        />
                      )}
                      {renderColorBar()}
                      {renderSliders(s.adjustHint)}
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
                  </>
                )}

                {/* ── Votre portrait porté / Your worn portrait ─────────────
                    Visible dès qu'une photo source existe (capture caméra ou
                    photo téléversée). La photo n'est envoyée au serveur QUE
                    pour cette génération. */}
                {portraitPhoto && (
                  <div className="mt-8 border-t border-border pt-6">
                    <h3 className="font-display text-lg font-bold">{s.portraitTitle}</h3>
                    <p className="mt-2 text-sm text-muted">{s.portraitIntro}</p>

                    {/* (L'aperçu simple de la photo téléversée est remplacé
                        par l'onglet « Sur photo » : canvas photo + façade.) */}
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

/**
 * Essayage SUR PHOTO (mode statique, façon « Upload photo » de Zenni) :
 * la photo téléversée est analysée UNE seule fois (FaceLandmarker.detect en
 * mode IMAGE, pose 3D incluse si disponible), puis photo + façade ancrée sont
 * rendues dans un canvas statique — même math que le live (sans miroir).
 * Les sliders Largeur/Hauteur re-rendent instantanément ; bouton Télécharger.
 * Tout reste dans le navigateur.
 */
function PhotoTryon({
  photo,
  frameSrc,
  frameBg,
  widthAdjust,
  heightAdjust,
  locale,
  slug,
}: {
  photo: string;
  frameSrc?: string | null;
  frameBg?: "transparent" | "white";
  widthAdjust: number;
  heightAdjust: number;
  locale: Locale;
  slug: string;
}) {
  const s = STRINGS[locale] ?? STRINGS.fr;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef<Array<{ x: number; y: number }> | null>(null);
  const poseRef = useRef<PoseAngles | null>(null);
  const [detect, setDetect] = useState<"pending" | "ok" | "none">("pending");

  // Rendu statique : photo, puis façade ancrée (pas de miroir sur une photo).
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = photoImgRef.current;
    if (!canvas || !img) return;
    const W = (canvas.width = img.naturalWidth || 1);
    const H = (canvas.height = img.naturalHeight || 1);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, W, H);
    const frame = frameImgRef.current;
    const landmarks = landmarksRef.current;
    if (frame && landmarks) {
      const anchor = computeFrameAnchor(landmarks, W, H, false, poseRef.current);
      drawFrameOverlay(
        ctx,
        frame,
        anchor,
        {
          w: Math.max(-50, Math.min(50, widthAdjust)),
          h: Math.max(-50, Math.min(50, heightAdjust)),
        },
        1
      );
    }
  }, [widthAdjust, heightAdjust]);

  // Détection UNE seule fois par photo (mode IMAGE, repli GPU → CPU).
  useEffect(() => {
    let cancelled = false;
    setDetect("pending");
    landmarksRef.current = null;
    poseRef.current = null;
    (async () => {
      try {
        const img = await loadImage(photo);
        if (cancelled) return;
        photoImgRef.current = img;
        render(); // affiche déjà la photo pendant l'analyse
        let result: any = null;
        try {
          const { landmarker } = await getImageLandmarker("GPU");
          result = landmarker.detect(img);
          landmarker.close?.();
        } catch {
          const { landmarker } = await getImageLandmarker("CPU");
          result = landmarker.detect(img);
          landmarker.close?.();
        }
        if (cancelled) return;
        const landmarks = result?.faceLandmarks?.[0] ?? null;
        landmarksRef.current = landmarks;
        poseRef.current = extractPose(result?.facialTransformationMatrixes?.[0]?.data);
        setDetect(landmarks ? "ok" : "none");
        render();
      } catch {
        if (!cancelled) setDetect("none");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  // Façade produit (ou neutre en repli) : même préparation que le live
  // (détourage blanc, érosion anti-halo, rognage alpha).
  useEffect(() => {
    let cancelled = false;
    const src = frameSrc || NEUTRAL_FRAME;
    prepareFrame(src, frameSrc ? frameBg : "transparent").then((img) => {
      if (!cancelled && img) {
        frameImgRef.current = img;
        render();
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameSrc, frameBg]);

  // Sliders : re-rendu instantané (render dépend de widthAdjust/heightAdjust).
  useEffect(() => {
    render();
  }, [render]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.9);
    a.download = `essayage-photo-${slug}.jpg`;
    a.click();
  }, [slug]);

  return (
    <div>
      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
        <canvas ref={canvasRef} className="block h-auto w-full" role="img" aria-label={s.photoAlt} />
        {detect === "pending" && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" /> {s.analyzing}
            </span>
          </div>
        )}
      </div>
      {detect === "none" && (
        <p className="mt-3 text-center text-sm text-muted" role="status">
          {s.noFace}
        </p>
      )}
      {detect === "ok" && (
        <div className="mt-5 flex justify-center">
          <Button onClick={download} variant="accent" className="gap-2">
            <ImageDown className="h-4 w-4" />
            {s.download}
          </Button>
        </div>
      )}
    </div>
  );
}
