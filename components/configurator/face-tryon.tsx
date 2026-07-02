"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFaceLandmarker } from "@/lib/face/mediapipe";
import { demoFrameOverlaySvg } from "@/lib/ai/demo-visuals";

// Façade neutre (gris foncé) en attendant la vraie monture — jamais orange.
const NEUTRAL_FRAME = demoFrameOverlaySvg(["#e7e7e7", "#2b2b2b", "#111111"]);

/**
 * Essayage AR « Essayer sur mon visage » : la façade transparente du concept
 * (vrai PNG IA, détouré + rogné sur l'alpha) est ancrée en temps réel aux
 * tempes (234/454) et à la ligne des yeux (33/263), vue miroir selfie.
 */
export function FaceTryon({
  frameSrc,
  frameBg,
  loading,
  onCapture,
}: {
  frameSrc?: string | null;
  frameBg?: "transparent" | "white";
  loading?: boolean;
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const noFaceRef = useRef(0);
  const cpuTriedRef = useRef(false);
  const switchingRef = useRef(false);
  const lmRef = useRef<any>(null);
  const filtersRef = useRef<ReturnType<typeof makeFilters> | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [frameReady, setFrameReady] = useState(false);

  const cleanup = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // Prépare la façade : neutre tant que la vraie n'est pas là, puis bascule.
  const realFrameRef = useRef(false); // la façade RÉELLE est-elle en place ?
  useEffect(() => {
    let cancelled = false;
    // Affiche d'abord la façade neutre pour ne jamais bloquer l'essayage —
    // sans JAMAIS écraser la vraie façade si elle est arrivée entre-temps
    // (realFrameRef, pas l'état React : pas de closure périmée).
    if (!frameImgRef.current) {
      prepareFrame(NEUTRAL_FRAME, "transparent").then((img) => {
        if (!cancelled && img && !realFrameRef.current) frameImgRef.current = img;
      });
    }
    if (frameSrc) {
      setFrameReady(false);
      prepareFrame(frameSrc, frameBg).then((img) => {
        if (!cancelled && img) {
          frameImgRef.current = img;
          realFrameRef.current = true;
          setFrameReady(true);
        }
      });
    } else {
      realFrameRef.current = false;
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameSrc, frameBg]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = lmRef.current;
    if (!runningRef.current || !video || !canvas || !lm) return;

    if (video.readyState >= 2 && video.videoWidth) {
      const W = (canvas.width = video.videoWidth);
      const H = (canvas.height = video.videoHeight);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const ts = performance.now();
        // Vue MIROIR (selfie) : mouvement naturel pour l'utilisateur.
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -W, 0, W, H);
        ctx.restore();

        let result: any = null;
        try {
          result = lm.detectForVideo(video, ts);
        } catch {
          result = null;
        }
        const landmarks = result?.faceLandmarks?.[0];
        const frame = frameImgRef.current;
        if (!landmarks) {
          noFaceRef.current += 1;
          if (noFaceRef.current >= 40 && !cpuTriedRef.current && !switchingRef.current) {
            cpuTriedRef.current = true;
            switchingRef.current = true;
            getFaceLandmarker("CPU")
              .then(({ landmarker }) => {
                lmRef.current = landmarker;
                noFaceRef.current = 0;
              })
              .catch(() => {})
              .finally(() => (switchingRef.current = false));
          }
        } else if (frame) {
          noFaceRef.current = 0;
          // Coordonnées en MIROIR (x → W - x) pour coller à la vidéo selfie.
          const p = (i: number) => ({ x: W - landmarks[i].x * W, y: landmarks[i].y * H });
          const tA = p(234);
          const tB = p(454);
          const eL = p(33);
          const eR = p(263);
          const targetW = Math.hypot(tB.x - tA.x, tB.y - tA.y) * 1.02;
          const cx = (tA.x + tB.x) / 2;
          const cy = (eL.y + eR.y) / 2;
          // Angle de la ligne des tempes ORDONNÉE gauche→droite EN ESPACE ÉCRAN.
          // Après le miroir, 234/454 s'inversent : sans cet ordre, atan2 rend
          // ±180° (façade dessinée à l'envers) et le filtre devient instable au
          // passage +π/−π (monture qui tournoie). Ici l'angle reste borné ±90°.
          const left = tA.x <= tB.x ? tA : tB;
          const right = tA.x <= tB.x ? tB : tA;
          const a = Math.atan2(right.y - left.y, right.x - left.x);

          // Filtre One-Euro : stable à l'arrêt, réactif en mouvement.
          if (!filtersRef.current) filtersRef.current = makeFilters();
          const f = filtersRef.current;
          const scx = f.cx(cx, ts);
          const scy = f.cy(cy, ts);
          const sw = f.w(targetW, ts);
          const sa = f.a(a, ts);

          const ratio = frame.naturalHeight / frame.naturalWidth;
          const h = sw * ratio;
          ctx.save();
          ctx.translate(scx, scy);
          ctx.rotate(sa);
          ctx.drawImage(frame, -sw / 2, -h / 2, sw, h);
          ctx.restore();
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(async () => {
    setStatus("loading");
    try {
      noFaceRef.current = 0;
      cpuTriedRef.current = false;
      filtersRef.current = makeFilters();
      const { landmarker } = await getFaceLandmarker("GPU");
      lmRef.current = landmarker;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setStatus("live");
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error("[face-tryon] error", e);
      setStatus("error");
    }
  }, [loop]);

  function capture() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  const preparing = Boolean(loading) || (Boolean(frameSrc) && !frameReady);

  return (
    <div>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-0" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <Camera className="h-12 w-12" />
            <p className="text-sm">Essayer sur mon visage</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
            Caméra indisponible. Vous pouvez tout de même utiliser la vue studio.
          </div>
        )}
        {status === "live" && preparing && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" /> Préparation de votre monture…
            </span>
          </div>
        )}
        {status === "live" && !preparing && !frameSrc && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              Aperçu générique — la façade exacte du concept est momentanément indisponible.
            </span>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {status !== "live" ? (
          <Button onClick={start} className="gap-2">
            <Camera className="h-4 w-4" /> Essayer sur mon visage
          </Button>
        ) : (
          <Button onClick={capture} variant="accent" className="gap-2">
            <ImageDown className="h-4 w-4" /> Capturer mon essayage
          </Button>
        )}
      </div>
      {status === "idle" && preparing && (
        <p className="mt-3 text-center text-xs text-muted">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Préparation de la monture du concept…
        </p>
      )}
    </div>
  );
}

// ── Filtre One-Euro : suivi facial stable et réactif ────────────────────────
// (lisse fortement les micro-tremblements à l'arrêt, suit vite en mouvement)
function oneEuro(minCutoff: number, beta: number, dCutoff = 1) {
  let xPrev: number | null = null;
  let dxPrev = 0;
  let tPrev = 0;
  const alpha = (cutoff: number, dt: number) => {
    const r = 2 * Math.PI * cutoff * dt;
    return r / (r + 1);
  };
  return (x: number, t: number) => {
    if (xPrev === null) {
      xPrev = x;
      tPrev = t;
      return x;
    }
    const dt = Math.min(Math.max((t - tPrev) / 1000, 1e-3), 0.1);
    tPrev = t;
    const dx = (x - xPrev) / dt;
    const aD = alpha(dCutoff, dt);
    dxPrev = aD * dx + (1 - aD) * dxPrev;
    const cutoff = minCutoff + beta * Math.abs(dxPrev);
    const a = alpha(cutoff, dt);
    xPrev = a * x + (1 - a) * xPrev;
    return xPrev;
  };
}

function makeFilters() {
  return {
    cx: oneEuro(1.6, 0.5),
    cy: oneEuro(1.6, 0.5),
    w: oneEuro(1.0, 0.35),
    a: oneEuro(1.0, 0.5),
  };
}

// ── Préparation de la façade : détourage blanc + rognage alpha ───────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function prepareFrame(
  src: string,
  bg: "transparent" | "white" | undefined
): Promise<HTMLImageElement | null> {
  try {
    const img = await loadImage(src);
    const w = img.naturalWidth || 1024;
    const h = img.naturalHeight || 1024;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return img;
    ctx.drawImage(img, 0, 0);
    let data: ImageData;
    try {
      data = ctx.getImageData(0, 0, w, h);
    } catch {
      return img;
    }
    const px = data.data;
    if (bg === "white") {
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        if (min > 205 && max - min < 26) px[i + 3] = 0;
      }
    }
    let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (px[(y * w + x) * 4 + 3] > 16) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (bg === "white") ctx.putImageData(data, 0, 0);
    if (!found) return img;
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const tc = document.createElement("canvas");
    tc.width = bw;
    tc.height = bh;
    const tctx = tc.getContext("2d");
    if (!tctx) return img;
    tctx.drawImage(c, minX, minY, bw, bh, 0, 0, bw, bh);
    return await loadImage(tc.toDataURL("image/png"));
  } catch {
    return null;
  }
}
