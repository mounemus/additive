"use client";

import { createElement, useEffect, useState } from "react";
import { Box, Loader2 } from "lucide-react";

/**
 * Visualiseur 3D GLB/GLTF — rotation, zoom et AR via le composant web
 * <model-viewer> de Google (chargé depuis le CDN, une seule fois).
 */
export function Model3DViewer({
  src,
  alt = "Modèle 3D",
  className,
  poster,
}: {
  src: string;
  alt?: string;
  className?: string;
  poster?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ID = "model-viewer-cdn";
    if (customElementsHas()) {
      setReady(true);
      return;
    }
    let s = document.getElementById(ID) as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = ID;
      s.type = "module";
      s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
      document.head.appendChild(s);
    }
    const check = setInterval(() => {
      if (customElementsHas()) {
        setReady(true);
        clearInterval(check);
      }
    }, 150);
    return () => clearInterval(check);
  }, []);

  if (!ready) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#777" }}>
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement du modèle 3D…
      </div>
    );
  }

  // <model-viewer> n'est pas typé par React → createElement.
  return createElement("model-viewer", {
    src,
    alt,
    poster,
    "camera-controls": true,
    "auto-rotate": true,
    "rotation-per-second": "20deg",
    "shadow-intensity": "1",
    exposure: "1.1",
    ar: true,
    "ar-modes": "webxr scene-viewer quick-look",
    "touch-action": "pan-y",
    style: { width: "100%", height: "100%", background: "#0a0a0a", borderRadius: "1rem" },
    className,
  });
}

function customElementsHas(): boolean {
  return typeof window !== "undefined" && !!window.customElements?.get("model-viewer");
}

/** État vide réutilisable quand aucun modèle 3D n'est disponible. */
export function Model3DEmpty({ className }: { className?: string }) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#0a0a0a", color: "#777" }}>
      <Box className="h-8 w-8" />
      <span style={{ fontSize: 13 }}>Aucun modèle 3D</span>
    </div>
  );
}
