"use client";

import { createElement, useEffect, useRef, useState } from "react";
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

export function Model3DViewer({
  src,
  alt = "Modèle 3D",
  className,
  poster,
  locale = "fr",
}: {
  src: string;
  alt?: string;
  className?: string;
  poster?: string;
  locale?: Locale;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [reducedMotion, setReducedMotion] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);

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
    const onLoad = () => setStatus("ready");
    const onError = () => setStatus("failed");
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [scriptReady, src]);

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
              : { "auto-rotate": true, "auto-rotate-delay": "1500", "rotation-per-second": "12deg" }),
            "interaction-prompt": "none",
            "shadow-intensity": "0.85",
            "shadow-softness": "0.9",
            exposure: "1.05",
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
