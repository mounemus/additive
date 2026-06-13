"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, ScanFace, Loader2, RotateCcw, SlidersHorizontal, Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFaceLandmarker, getImageLandmarker } from "@/lib/face/mediapipe";
import {
  measureFace,
  averageMeasurements,
  classifyShape,
  type FaceMeasurements,
} from "@/lib/face/face-analysis";
import { FACE_SHAPES, type FaceShape } from "@/lib/configurator";

export type ScanResult = {
  faceShape: FaceShape;
  measurements: FaceMeasurements | null;
  photoDataUrl: string | null;
};

const NO_FACE_RETRY = 40; // frames sans visage avant repli CPU

// Lignes de mesure dessinées sur le visage (indices MediaPipe + clé de mesure).
const MEASURE_LINES: {
  a: number;
  b: number;
  key: keyof FaceMeasurements;
  label: string;
  vertical?: boolean;
}[] = [
  { a: 21, b: 251, key: "foreheadWidthMm", label: "Front" },
  { a: 468, b: 473, key: "pupillaryDistanceMm", label: "Pupilles" },
  { a: 234, b: 454, key: "faceWidthMm", label: "Visage" },
  { a: 10, b: 152, key: "faceHeightMm", label: "Hauteur", vertical: true },
  { a: 172, b: 397, key: "jawWidthMm", label: "Mâchoire" },
];

export function FaceScanner({ onComplete }: { onComplete: (r: ScanResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const samplesRef = useRef<FaceMeasurements[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const lmRef = useRef<any>(null);
  const noFaceRef = useRef(0);
  const cpuTriedRef = useRef(false);
  const switchingRef = useRef(false);
  const fpsRef = useRef<number[]>([]);

  const [mode, setMode] = useState<"idle" | "camera" | "upload" | "manual">("idle");
  const [status, setStatus] = useState<"none" | "loading" | "scanning" | "error">("none");
  const [faceSeen, setFaceSeen] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [diag, setDiag] = useState("");

  const cleanup = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // Capture MANUELLE : fige la moyenne des mesures accumulées.
  const capture = useCallback(() => {
    const avg = averageMeasurements(samplesRef.current);
    const shape = avg ? classifyShape(avg) : "ovale";
    let photo: string | null = null;
    const video = videoRef.current;
    if (video && video.videoWidth) {
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, c.width, c.height);
        photo = c.toDataURL("image/jpeg", 0.85);
      }
    }
    cleanup();
    onComplete({ faceShape: shape, measurements: avg, photoDataUrl: photo });
  }, [cleanup, onComplete]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = lmRef.current;
    if (!runningRef.current || !video || !canvas || !lm) return;

    // FPS
    const now = performance.now();
    fpsRef.current.push(now);
    fpsRef.current = fpsRef.current.filter((t) => now - t < 1000);
    setFps(fpsRef.current.length);

    if (video.readyState >= 2 && video.videoWidth > 0) {
      const W = (canvas.width = video.videoWidth);
      const H = (canvas.height = video.videoHeight);
      const ctx = canvas.getContext("2d");
      let result: any = null;
      try {
        result = lm.detectForVideo(video, now);
      } catch (e) {
        setDiag(`Erreur : ${(e as Error)?.message ?? "détection"}`);
      }
      const landmarks = result?.faceLandmarks?.[0];

      if (ctx) {
        ctx.clearRect(0, 0, W, H);
        if (landmarks) {
          noFaceRef.current = 0;
          if (!faceSeen) setFaceSeen(true);

          // Coordonnées miroir (vidéo selfie) — texte dessiné à l'endroit.
          const pt = (i: number) => ({ x: W - landmarks[i].x * W, y: landmarks[i].y * H });

          // Nuage de points discret (triangulation).
          ctx.fillStyle = "rgba(120,180,255,0.45)";
          for (let i = 0; i < landmarks.length; i += 1) {
            const p = pt(i);
            ctx.fillRect(p.x, p.y, 1.3, 1.3);
          }

          // Mesures accumulées (cap 90) + valeurs lissées pour l'affichage.
          const m = measureFace(landmarks, W, H);
          if (m && m.pupillaryDistanceMm > 40 && m.pupillaryDistanceMm < 95) {
            samplesRef.current.push(m);
            if (samplesRef.current.length > 90) samplesRef.current.shift();
          }
          const disp = averageMeasurements(samplesRef.current.slice(-15)) ?? m;

          // Lignes de mesure étiquetées.
          for (const ml of MEASURE_LINES) {
            if (!landmarks[ml.a] || !landmarks[ml.b]) continue;
            const p1 = pt(ml.a);
            const p2 = pt(ml.b);
            drawMeasureLine(ctx, p1, p2, `${ml.label} ${disp ? Math.round(disp[ml.key]) : "—"} mm`);
          }
          setDiag("");
        } else {
          if (faceSeen) setFaceSeen(false);
          noFaceRef.current += 1;
          if (noFaceRef.current === 8) setDiag("Recherche d'un visage… centrez-vous, bonne lumière.");
          if (noFaceRef.current >= NO_FACE_RETRY && !cpuTriedRef.current && !switchingRef.current) {
            cpuTriedRef.current = true;
            switchingRef.current = true;
            setDiag("Optimisation du moteur d'analyse…");
            getFaceLandmarker("CPU")
              .then(({ landmarker }) => {
                lmRef.current = landmarker;
                noFaceRef.current = 0;
              })
              .catch(() => {})
              .finally(() => (switchingRef.current = false));
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [faceSeen]);

  const startCamera = useCallback(async () => {
    setMode("camera");
    setStatus("loading");
    setError(null);
    setDiag("");
    setFaceSeen(false);
    samplesRef.current = [];
    noFaceRef.current = 0;
    cpuTriedRef.current = false;
    try {
      const { landmarker } = await getFaceLandmarker("GPU");
      lmRef.current = landmarker;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setStatus("scanning");
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error("[face-scanner] camera error", e);
      setStatus("error");
      setError("Impossible d'accéder à la caméra ou de charger l'analyse. Téléversez une photo ou choisissez votre forme manuellement.");
    }
  }, [loop]);

  const handleUpload = useCallback(async (file: File) => {
    setMode("upload");
    setStatus("loading");
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      let landmarks: any = null;
      for (const delegate of ["GPU", "CPU"] as const) {
        try {
          const { landmarker } = await getImageLandmarker(delegate);
          const result = landmarker.detect(img);
          landmarks = result?.faceLandmarks?.[0];
          if (landmarks) break;
        } catch {
          /* délégué suivant */
        }
      }
      if (!landmarks) {
        setStatus("error");
        setError("Aucun visage détecté sur cette photo. Réessayez avec une photo de face, bien éclairée.");
        return;
      }
      const m = measureFace(landmarks, img.naturalWidth, img.naturalHeight);
      const shape = m ? classifyShape(m) : "ovale";
      onComplete({ faceShape: shape, measurements: m, photoDataUrl: dataUrl });
    } catch (e) {
      console.error("[face-scanner] upload error", e);
      setStatus("error");
      setError("L'analyse de la photo a échoué. Choisissez votre forme manuellement.");
    }
  }, [onComplete]);

  function cancel() {
    cleanup();
    setMode("idle");
    setStatus("none");
    setFaceSeen(false);
    samplesRef.current = [];
  }

  if (mode === "manual") {
    return (
      <div>
        <h3 className="font-display text-lg font-semibold">Choisissez la forme la plus proche</h3>
        <p className="mt-2 text-sm text-muted">Pas de caméra ? Sélectionnez votre morphologie — vous pourrez l'affiner plus tard.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FACE_SHAPES.map((shape) => (
            <button
              key={shape.id}
              onClick={() => onComplete({ faceShape: shape.id, measurements: null, photoDataUrl: null })}
              className="rounded-2xl border border-border p-5 text-left transition-all hover:border-accent-blue hover:bg-accent-blue/5"
            >
              <p className="font-display font-semibold">{shape.label}</p>
              <p className="mt-1 text-xs text-muted">{shape.hint}</p>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-6 gap-2" onClick={() => { setMode("idle"); setStatus("none"); }}>
          <RotateCcw className="h-4 w-4" /> Revenir
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" playsInline muted />
        {/* Canvas NON miroir : coords miroir en JS, texte lisible. */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

        {mode === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <ScanFace className="h-12 w-12" />
            <p className="text-sm">Analyse faciale en direct</p>
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Chargement de l'analyse…</p>
          </div>
        )}
        {status === "scanning" && (
          <div className="absolute bottom-4 left-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <span className={`inline-block h-2 w-2 rounded-full ${faceSeen ? "bg-emerald-400" : "bg-amber-400"}`} />
              {faceSeen ? `Visage détecté — triangulation active (${fps} ips)` : diag || "Recherche d'un visage…"}
            </span>
          </div>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}

      {status === "scanning" ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Button onClick={capture} disabled={!faceSeen} size="lg" className="gap-2">
            <Aperture className="h-4 w-4" /> Capturer mon analyse
          </Button>
          <button onClick={cancel} className="text-sm text-muted underline-offset-4 hover:underline">
            Annuler
          </button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted" onClick={() => setMode("manual")}>
            <SlidersHorizontal className="h-4 w-4" /> Choisir manuellement
          </Button>
        </div>
      ) : mode === "idle" || status === "error" ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={startCamera} className="gap-2">
            <Camera className="h-4 w-4" /> Activer la caméra
          </Button>
          <label>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
            <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-foreground/25 px-7 text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
              <Upload className="h-4 w-4" /> Téléverser une photo
            </span>
          </label>
          <Button variant="ghost" className="gap-2" onClick={() => setMode("manual")}>
            <SlidersHorizontal className="h-4 w-4" /> Choisir manuellement
          </Button>
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-muted">
        L'analyse s'effectue dans votre navigateur. Capturez quand le cadrage vous convient — aucune image n'est envoyée sans votre accord.
      </p>
    </div>
  );
}

// ── Dessin d'une ligne de mesure étiquetée (pointillés + ticks + label) ──────
function drawMeasureLine(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  text: string
) {
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ticks perpendiculaires aux extrémités.
  const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x) + Math.PI / 2;
  const t = 5;
  for (const p of [p1, p2]) {
    ctx.beginPath();
    ctx.moveTo(p.x - Math.cos(ang) * t, p.y - Math.sin(ang) * t);
    ctx.lineTo(p.x + Math.cos(ang) * t, p.y + Math.sin(ang) * t);
    ctx.stroke();
  }

  // Étiquette au milieu.
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  ctx.font = "600 12px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = ctx.measureText(text).width + 12;
  const h = 18;
  ctx.fillStyle = "rgba(10,10,10,0.82)";
  roundRect(ctx, mx - w / 2, my - h / 2, w, h, 5);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, mx, my + 0.5);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
