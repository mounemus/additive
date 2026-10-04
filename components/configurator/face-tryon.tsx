"use client";

import { withBase } from "@/lib/base-path";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFaceLandmarker } from "@/lib/face/mediapipe";
import { demoFrameOverlaySvg } from "@/lib/ai/demo-visuals";

// Façade neutre (gris foncé) en attendant la vraie monture — jamais orange.
// Exportée : le mode « Sur photo » (product-tryon) l'utilise en repli aussi.
export const NEUTRAL_FRAME = demoFrameOverlaySvg(["#e7e7e7", "#2b2b2b", "#111111"]);

// Libellés internes FR/EN — cohérents avec la prop `locale` (défaut fr).
const TRYON_STRINGS = {
  fr: {
    start: "Essayer sur mon visage",
    capture: "Capturer mon essayage",
    cameraError: "Caméra indisponible. Vous pouvez tout de même utiliser la vue studio.",
    preparing: "Préparation de votre monture…",
    genericNotice: "Aperçu générique — la façade exacte du modèle est momentanément indisponible.",
    preparingConcept: "Préparation de la monture…",
    faceHint: "Revenez face caméra",
  },
  en: {
    start: "Try on my face",
    capture: "Capture my try-on",
    cameraError: "Camera unavailable. You can still use the studio view.",
    preparing: "Preparing your frame…",
    genericNotice: "Generic preview — the exact frame for this model is momentarily unavailable.",
    preparingConcept: "Preparing the frame…",
    faceHint: "Face the camera",
  },
} as const;

// ── Pose 3D (matrice de transformation faciale MediaPipe) ───────────────────

export type PoseAngles = { yaw: number; pitch: number; roll: number };

/**
 * Extrait yaw/pitch/roll (radians) de la matrice de transformation faciale
 * 4x4 COLONNE-MAJOR de MediaPipe (r_ij = d[j*4+i]), décomposition
 * R = Ry(yaw)·Rx(pitch)·Rz(roll) en espace caméra (X droite, Y haut, Z vers
 * la caméra). yaw > 0 = tête tournée vers la gauche du sujet.
 */
export function extractPose(matrixData: ArrayLike<number> | undefined | null): PoseAngles | null {
  if (!matrixData || matrixData.length < 16) return null;
  const d = matrixData;
  const r10 = d[1];
  const r11 = d[5];
  const r02 = d[8];
  const r12 = d[9];
  const r22 = d[10];
  return {
    yaw: Math.atan2(r02, r22),
    pitch: Math.asin(Math.max(-1, Math.min(1, -r12))),
    roll: Math.atan2(r10, r11),
  };
}

export type FrameAnchor = {
  cx: number;
  cy: number;
  width: number;
  /** Rotation (roll) à appliquer au canvas, en espace écran. */
  angle: number;
  /** Yaw en espace ÉCRAN (positif = visage pointant vers la droite écran). */
  yaw: number;
  pitch: number;
};

/**
 * Ancrage de la façade : tempes (234/454) pour la largeur, pupilles (33/263)
 * pour la hauteur — même math en live (miroir) et en photo statique.
 * Si la pose 3D est disponible, le roll matrice remplace l'approximation
 * tempes/yeux et yaw/pitch pilotent compression + décalage de la façade.
 */
export function computeFrameAnchor(
  landmarks: Array<{ x: number; y: number }>,
  W: number,
  H: number,
  mirror: boolean,
  pose: PoseAngles | null
): FrameAnchor {
  const p = (i: number) =>
    mirror
      ? { x: W - landmarks[i].x * W, y: landmarks[i].y * H }
      : { x: landmarks[i].x * W, y: landmarks[i].y * H };
  const tA = p(234);
  const tB = p(454);
  const eL = p(33);
  const eR = p(263);
  const templeDist = Math.hypot(tB.x - tA.x, tB.y - tA.y);
  // Légèrement plus large que l'écart des tempes : couvre les charnières.
  const width = templeDist * 1.08;
  const cx = (tA.x + tB.x) / 2;
  // Les verres se centrent sur les PUPILLES : ancrage un peu SOUS la ligne
  // des yeux (et non au niveau des sourcils).
  const cy = (eL.y + eR.y) / 2 + templeDist * 0.04;
  // Angle 2D de repli : moyenne des lignes TEMPES et YEUX, chacune ordonnée
  // gauche→droite EN ESPACE ÉCRAN (sinon atan2 rend ±180° après miroir).
  const lineAngle = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const left = p1.x <= p2.x ? p1 : p2;
    const right = p1.x <= p2.x ? p2 : p1;
    return Math.atan2(right.y - left.y, right.x - left.x);
  };
  const lmAngle = (lineAngle(tA, tB) + lineAngle(eL, eR)) / 2;
  let angle = lmAngle;
  let yaw = 0;
  let pitch = 0;
  if (pose) {
    // Roll matrice — signe théorique : +roll en vue miroir, −roll sinon
    // (Y monde vers le haut vs y écran vers le bas). Par sécurité, le signe
    // est réconcilié avec l'angle 2D des landmarks (bonne approximation du
    // roll réel) : insensible aux conventions d'axes du modèle.
    const mr = mirror ? pose.roll : -pose.roll;
    angle = Math.abs(mr - lmAngle) <= Math.abs(-mr - lmAngle) ? mr : -mr;
    // Yaw écran : en miroir, tourner la tête vers SA gauche pointe le visage
    // vers la gauche de l'écran → signe inversé par rapport à la matrice.
    yaw = mirror ? -pose.yaw : pose.yaw;
    pitch = pose.pitch;
  }
  return { cx, cy, width, angle, yaw, pitch };
}

/**
 * Dessine la façade ancrée : réglages utilisateur (Largeur/Hauteur), pose 3D
 * (compression cos(yaw)/cos(pitch), décalage vers où pointe le visage),
 * ombre portée douce. Partagé entre le live et le mode photo statique.
 */
export function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  frame: HTMLImageElement,
  a: FrameAnchor,
  adj: { w: number; h: number },
  opacity = 1
) {
  const dw = a.width * (1 + adj.w / 200); // -50..50 → ±25 %
  const dy = a.width * (adj.h / 400); // -50..50 → ± ~12 % de la largeur
  const ratio = frame.naturalHeight / frame.naturalWidth;
  const h = dw * ratio;
  // Pose 3D : la façade suit la rotation de tête — compression horizontale
  // cos(yaw) + décalage x proportionnel à sin(yaw), léger équivalent en pitch.
  const scaleX = Math.max(0.35, Math.cos(a.yaw));
  const scaleY = Math.max(0.5, Math.cos(a.pitch));
  const dxYaw = Math.sin(a.yaw) * dw * 0.25;
  const dyPitch = Math.sin(a.pitch) * dw * 0.1;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(a.cx + dxYaw, a.cy + dy + dyPitch);
  ctx.rotate(a.angle);
  // Échelle APRÈS rotation : la compression suit l'axe propre de la façade.
  ctx.scale(scaleX, scaleY);
  // Ombre portée douce sur la façade seule : effet « posée sur le nez ».
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(frame, -dw / 2, -h / 2, dw, h);
  ctx.restore();
}

// Seuils du hint « Revenez face caméra » (hystérésis anti-clignotement).
const YAW_HINT_ON_DEG = 28;
const YAW_HINT_OFF_DEG = 24;

/**
 * Essayage AR « Essayer sur mon visage » : la façade transparente du concept
 * (vrai PNG IA, détouré + rogné sur l'alpha) est ancrée en temps réel aux
 * tempes (234/454) et centrée sur les pupilles (33/263), vue miroir selfie.
 * La pose 3D (matrice faciale) pilote rotation, compression et décalage.
 */
export function FaceTryon({
  frameSrc,
  frameBg,
  loading,
  onCapture,
  locale = "fr",
  widthAdjust = 0,
  heightAdjust = 0,
}: {
  frameSrc?: string | null;
  frameBg?: "transparent" | "white";
  loading?: boolean;
  onCapture: (dataUrl: string) => void;
  locale?: "fr" | "en";
  /** Réglage utilisateur -50..50 : échelle horizontale de la façade (±25 %). */
  widthAdjust?: number;
  /** Réglage utilisateur -50..50 : offset vertical de la façade (± ~12 % de sa largeur). */
  heightAdjust?: number;
}) {
  const s = TRYON_STRINGS[locale] ?? TRYON_STRINGS.fr;
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
  // Réglages utilisateur lus dans la boucle rAF via ref (loop en useCallback([])).
  const adjRef = useRef({ w: 0, h: 0 });
  useEffect(() => {
    adjRef.current = {
      w: Math.max(-50, Math.min(50, widthAdjust)),
      h: Math.max(-50, Math.min(50, heightAdjust)),
    };
  }, [widthAdjust, heightAdjust]);

  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [frameReady, setFrameReady] = useState(false);
  // Hint « Revenez face caméra » quand |yaw| dépasse ~28° (façade estompée).
  const [offAxis, setOffAxis] = useState(false);
  const offAxisRef = useRef(false);

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
          // Visage perdu : on retire le hint de pose (il n'a plus de sens).
          if (offAxisRef.current) {
            offAxisRef.current = false;
            setOffAxis(false);
          }
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
          // Ancrage partagé (miroir selfie) + pose 3D si la matrice est là.
          const pose = extractPose(result?.facialTransformationMatrixes?.[0]?.data);
          const raw = computeFrameAnchor(landmarks, W, H, true, pose);

          // Filtre One-Euro : stable à l'arrêt, réactif en mouvement
          // (yaw/pitch lissés comme le reste).
          if (!filtersRef.current) filtersRef.current = makeFilters();
          const f = filtersRef.current;
          const anchor: FrameAnchor = {
            cx: f.cx(raw.cx, ts),
            cy: f.cy(raw.cy, ts),
            width: f.w(raw.width, ts),
            angle: f.a(raw.angle, ts),
            yaw: f.yaw(raw.yaw, ts),
            pitch: f.pitch(raw.pitch, ts),
          };

          // Hint « Revenez face caméra » (hystérésis 28°/24°) + façade estompée.
          const yawDeg = Math.abs(anchor.yaw) * (180 / Math.PI);
          const off = offAxisRef.current ? yawDeg > YAW_HINT_OFF_DEG : yawDeg > YAW_HINT_ON_DEG;
          if (off !== offAxisRef.current) {
            offAxisRef.current = off;
            setOffAxis(off);
          }

          drawFrameOverlay(ctx, frame, anchor, adjRef.current, off ? 0.3 : 1);
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
            <p className="text-sm">{s.start}</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
            {s.cameraError}
          </div>
        )}
        {status === "live" && preparing && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" /> {s.preparing}
            </span>
          </div>
        )}
        {status === "live" && !preparing && !frameSrc && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              {s.genericNotice}
            </span>
          </div>
        )}
        {status === "live" && offAxis && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              {s.faceHint}
            </span>
          </div>
        )}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {status !== "live" ? (
          <Button onClick={start} className="gap-2">
            <Camera className="h-4 w-4" /> {s.start}
          </Button>
        ) : (
          <Button onClick={capture} variant="accent" className="gap-2">
            <ImageDown className="h-4 w-4" /> {s.capture}
          </Button>
        )}
      </div>
      {status === "idle" && preparing && (
        <p className="mt-3 text-center text-xs text-muted">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> {s.preparingConcept}
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
    // minCutoff position 2.2 : suivi plus réactif (moins de « traîne »)
    // sans réintroduire de tremblement visible à l'arrêt.
    cx: oneEuro(2.2, 0.5),
    cy: oneEuro(2.2, 0.5),
    w: oneEuro(1.0, 0.35),
    a: oneEuro(1.0, 0.5),
    // Pose 3D : lissage un peu plus ferme (les angles matrice sont bruités).
    yaw: oneEuro(1.2, 0.5),
    pitch: oneEuro(1.2, 0.5),
  };
}

// ── Préparation de la façade : détourage blanc + rognage alpha ───────────────
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = withBase(src);
  });
}

/**
 * Élimine le halo blanc résiduel autour de la façade détourée :
 * 1) ÉROSION 1 px de l'alpha (chaque pixel prend le min de son voisinage en
 *    croix — la frange extérieure d'un pixel disparaît) ;
 * 2) DÉFRANGE : un pixel encore semi-transparent nettement plus CLAIR que ses
 *    voisins opaques est un reste de fond blanc → alpha 0.
 */
function erodeAndDefringe(px: Uint8ClampedArray, w: number, h: number) {
  // Copie de l'alpha : l'érosion lit l'état d'origine, pas ses propres écrits.
  const alpha = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i += 1) alpha[i] = px[i * 4 + 3];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      let m = alpha[i];
      if (m === 0) continue;
      m = Math.min(m, x > 0 ? alpha[i - 1] : 0);
      m = Math.min(m, x < w - 1 ? alpha[i + 1] : 0);
      m = Math.min(m, y > 0 ? alpha[i - w] : 0);
      m = Math.min(m, y < h - 1 ? alpha[i + w] : 0);
      px[i * 4 + 3] = m;
    }
  }
  const luma = (i: number) => 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      const a = px[i * 4 + 3];
      if (a === 0 || a >= 250) continue;
      // Luminance max des voisins OPAQUES : référence de la couleur monture.
      let ref = -1;
      const neighbors = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of neighbors) {
        if (j >= 0 && px[j * 4 + 3] >= 200) {
          const l = luma(j);
          if (l > ref) ref = l;
        }
      }
      if (ref >= 0 && luma(i) > ref + 18) px[i * 4 + 3] = 0;
    }
  }
}

export async function prepareFrame(
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
    // Après le knockout (ou l'alpha natif) : érosion 1 px + défrange, pour
    // supprimer le halo blanc résiduel en bordure de façade.
    erodeAndDefringe(px, w, h);
    ctx.putImageData(data, 0, 0);
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
