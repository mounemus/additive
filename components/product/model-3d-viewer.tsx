"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { Box, ImageOff, Loader2, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

/**
 * Visualiseur 3D GLB/GLTF premium — rotation, zoom et AR via le composant web
 * <model-viewer> de Google (chargé une seule fois depuis le CDN).
 *
 * - camera-controls (orbite/zoom), auto-rotate lent désactivé si
 *   prefers-reduced-motion, exposure/ombre soignés ;
 * - poster = image produit pendant le chargement ;
 * - timeout 8 s → repli image propre (jamais de spinner infini) ;
 * - AR natif (webxr / scene-viewer / quick-look) avec bouton custom
 *   « Voir en AR » (slot ar-button, masqué par model-viewer si AR indispo).
 *
 * Les GLB du catalogue sont compressés Draco : le décodeur est téléchargé
 * depuis www.gstatic.com (autorisé dans la CSP, voir next.config.mjs).
 */

const CDN_SCRIPT_ID = "model-viewer-cdn";
const CDN_SRC =
  "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
const LOAD_TIMEOUT_MS = 8000;

const LABELS = {
  loading: { fr: "Chargement du modèle 3D…", en: "Loading 3D model…" },
  fallback: {
    fr: "Aperçu 3D indisponible — photo du produit",
    en: "3D preview unavailable — product photo",
  },
  ar: { fr: "Voir en AR / chez vous", en: "View in AR / at home" },
} as const;

type ViewerStatus = "loading" | "ready" | "failed";

// ── Recoloration de la MONTURE via l'API matériaux de model-viewer ──────────
// Même heuristique que l'essayage 3D (tryon-3d.tsx) : les matériaux « verres »
// (nom lens/verre/glass/… ou transparents) sont exclus, les autres reçoivent
// pbrMetallicRoughness.setBaseColorFactor — la texture reste multipliée par le
// facteur, le grain du matériau est donc préservé.

const LENS_LABEL_RE = /lens|verre|glass|vitre|crystal|optic/i;

/** Sous-ensemble non typé de l'API Material de <model-viewer>. */
type MvMaterial = {
  name?: string;
  getAlphaMode?: () => string;
  pbrMetallicRoughness?: {
    baseColorFactor?: ArrayLike<number>;
    setBaseColorFactor?: (rgba: [number, number, number, number]) => void;
  };
};

function hexToRgb01(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function Model3DViewer({
  src,
  alt = "Modèle 3D",
  className,
  poster,
  locale = "fr",
  frameColorHex = null,
}: {
  src: string;
  alt?: string;
  className?: string;
  poster?: string;
  locale?: Locale;
  /** Coloris de MONTURE (hex) appliqué aux matériaux non-verres ; null = origine. */
  frameColorHex?: string | null;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [reducedMotion, setReducedMotion] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);
  // Facteurs baseColor d'ORIGINE par matériau (restaurés quand hex = null).
  const origColorsRef = useRef(new Map<object, [number, number, number, number]>());
  const frameColorRef = useRef<string | null>(frameColorHex);

  /**
   * Applique (ou restaure) la couleur de monture sur le modèle chargé.
   * Si aucun matériau de monture n'est identifiable, ne fait rien — le
   * visualiseur reste intact quoi qu'il arrive (try/catch par matériau).
   */
  const applyFrameColor = useCallback((hex: string | null) => {
    const viewer = viewerRef.current as unknown as {
      model?: { materials?: MvMaterial[] };
    } | null;
    const materials = viewer?.model?.materials;
    if (!materials || !materials.length) return;
    const rgb = hex ? hexToRgb01(hex) : null;
    for (const mat of materials) {
      try {
        const pbr = mat?.pbrMetallicRoughness;
        if (!pbr?.setBaseColorFactor) continue;
        const stored = origColorsRef.current.get(mat as object);
        const raw = stored ?? Array.from(pbr.baseColorFactor ?? [1, 1, 1, 1]);
        const factor: [number, number, number, number] = [
          raw[0] ?? 1,
          raw[1] ?? 1,
          raw[2] ?? 1,
          raw[3] ?? 1,
        ];
        // Heuristique « verre » identique à tryon-3d : nom évocateur, ou
        // matériau en blending avec alpha nettement transparent.
        const alphaMode =
          typeof mat.getAlphaMode === "function" ? mat.getAlphaMode() : "OPAQUE";
        const isLens =
          LENS_LABEL_RE.test(String(mat.name ?? "")) ||
          (alphaMode === "BLEND" && factor[3] < 0.9);
        if (isLens) continue;
        if (!stored) origColorsRef.current.set(mat as object, factor);
        if (rgb) pbr.setBaseColorFactor([rgb[0], rgb[1], rgb[2], factor[3]]);
        else pbr.setBaseColorFactor(factor);
      } catch {
        // Matériau atypique : ignoré, jamais bloquant.
      }
    }
  }, []);

  // Ré-application au changement de coloris, sans recharger le GLB.
  useEffect(() => {
    frameColorRef.current = frameColorHex;
    if (status === "ready") applyFrameColor(frameColorHex);
  }, [frameColorHex, status, applyFrameColor]);

  // Respecte prefers-reduced-motion : pas d'auto-rotation.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Injection unique du script model-viewer.
  useEffect(() => {
    if (customElementsHas()) {
      setScriptReady(true);
      return;
    }
    let s = document.getElementById(CDN_SCRIPT_ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = CDN_SCRIPT_ID;
      s.type = "module";
      s.src = CDN_SRC;
      document.head.appendChild(s);
    }
    const check = setInterval(() => {
      if (customElementsHas()) {
        setScriptReady(true);
        clearInterval(check);
      }
    }, 150);
    return () => clearInterval(check);
  }, []);

  // Garde-fou global : si le modèle n'est pas prêt en 8 s (script bloqué,
  // GLB introuvable, décodeur Draco refusé…), on bascule sur l'image.
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(() => {
      setStatus((s) => (s === "ready" ? s : "failed"));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [status, src]);

  // Écoute load/error du custom element une fois le script prêt.
  useEffect(() => {
    if (!scriptReady) return;
    const el = viewerRef.current;
    if (!el) return;
    const onLoad = () => {
      // Nouveau modèle : facteurs d'origine à re-capturer, coloris ré-appliqué.
      origColorsRef.current = new Map();
      applyFrameColor(frameColorRef.current);
      setStatus("ready");
    };
    const onError = () => setStatus("failed");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [scriptReady, src, applyFrameColor]);

  // Repli propre : image produit + mention discrète (plus de spinner infini).
  if (status === "failed") {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-surface-dark",
          className
        )}
      >
        {poster ? (
          /* URL du poster potentiellement hors des domaines next/image configurés. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Box aria-hidden className="h-10 w-10 text-muted" />
        )}
        <p className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">
          <ImageOff aria-hidden className="h-3.5 w-3.5" />
          {LABELS.fallback[locale]}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-surface-dark", className)}>
      {scriptReady &&
        // <model-viewer> n'est pas typé par React → createElement.
        createElement(
          "model-viewer",
          {
            ref: viewerRef,
            src,
            alt,
            poster,
            reveal: "auto",
            loading: "eager",
            "camera-controls": true,
            ...(reducedMotion
              ? {}
              : { "auto-rotate": true, "auto-rotate-delay": "1500", "rotation-per-second": "14deg" }),
            "interaction-prompt": "none",
            // ── Rendu qualité « photo produit » ──────────────────────────
            // Environnement studio auto-hébergé (softboxes) → réflexions
            // douces sur le nylon satiné ; ciel de fond gardé transparent.
            "environment-image": "/env/studio.jpg",
            // Khronos PBR Neutral : le tone-mapping conçu pour l'e-commerce
            // (couleurs fidèles, pas de sur-saturation ni de highlights cramés).
            "tone-mapping": "neutral",
            exposure: "1",
            // Ombre de contact douce sous la monture.
            "shadow-intensity": "1.1",
            "shadow-softness": "1",
            // Objectif long (téléobjectif produit) : compresse la perspective,
            // supprime la distorsion grand-angle sur les branches. Cadrage 3/4.
            "field-of-view": "26deg",
            "min-field-of-view": "18deg",
            "max-field-of-view": "40deg",
            "camera-orbit": "-22deg 76deg 105%",
            "min-camera-orbit": "auto auto 88%",
            "max-camera-orbit": "auto auto 150%",
            "interpolation-decay": "160",
            ar: true,
            "ar-modes": "webxr scene-viewer quick-look",
            "ar-scale": "auto",
            "touch-action": "pan-y",
            style: { width: "100%", height: "100%", display: "block" },
          },
          // Bouton AR custom : model-viewer le masque automatiquement
          // quand aucun mode AR n'est disponible sur l'appareil.
          <button
            key="ar"
            slot="ar-button"
            type="button"
            className="focus-ring absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm font-medium text-foreground shadow-card backdrop-blur transition-colors duration-200 hover:bg-surface"
          >
            <Scan aria-hidden className="h-4 w-4 text-accent-blue" />
            {LABELS.ar[locale]}
          </button>
        )}

      {(!scriptReady || status === "loading") && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          {poster && !scriptReady && (
            /* Même raison que le repli : URL hors config next/image possible. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
          )}
          <span className="relative flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-sm text-white backdrop-blur">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {LABELS.loading[locale]}
          </span>
        </div>
      )}
    </div>
  );
}

function customElementsHas(): boolean {
  return typeof window !== "undefined" && !!window.customElements?.get("model-viewer");
}

/** État vide réutilisable quand aucun modèle 3D n'est disponible. */
export function Model3DEmpty({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 bg-surface-dark text-muted",
        className
      )}
    >
      <Box aria-hidden className="h-8 w-8" />
      <span className="text-[13px]">Aucun modèle 3D</span>
    </div>
  );
}
