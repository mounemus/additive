"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, ScanFace, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const TARGET_FRAMES = 28;
const NO_FACE_RETRY = 40; // frames sans visage avant repli CPU

export function FaceScanner({ onComplete }: { onComplete: (r: ScanResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const samplesRef = useRef<FaceMeasurements[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const lmRef = useRef<any>(null);
  const visionRef = useRef<any>(null);
  const noFaceRef = useRef(0);
  const cpuTriedRef = useRef(false);
  const switchingRef = useRef(false);

  const [mode, setMode] = useState<"idle" | "camera" | "upload" | "manual">("idle");
  const [status, setStatus] = useState<"none" | "loading" | "scanning" | "error">("none");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [diag, setDiag] = useState<string>("");

  const cleanup = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const finalize = useCallback(() => {
    cleanup();
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
    onComplete({ faceShape: shape, measurements: avg, photoDataUrl: photo });
  }, [cleanup, onComplete]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = lmRef.current;
    const vision = visionRef.current;
    if (!runningRef.current || !video || !canvas || !lm || !vision) return;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      let result: any = null;
      try {
        result = lm.detectForVideo(video, performance.now());
      } catch (e) {
        setDiag(`Erreur de détection : ${(e as Error)?.message ?? "inconnue"}`);
      }
      const landmarks = result?.faceLandmarks?.[0];
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (landmarks) {
          noFaceRef.current = 0;
          // Dessin du maillage — robuste : repli en points manuels si l'API
          // DrawingUtils diffère, pour ne jamais bloquer l'analyse.
          try {
            const FL = vision.FaceLandmarker;
            const draw = new vision.DrawingUtils(ctx);
            draw.drawConnectors(landmarks, FL.FACE_LANDMARKS_TESSELATION, { color: "rgba(31,111,255,0.3)", lineWidth: 0.6 });
            draw.drawConnectors(landmarks, FL.FACE_LANDMARKS_FACE_OVAL, { color: "rgba(255,106,42,0.75)", lineWidth: 1.6 });
            if (FL.FACE_LANDMARKS_LEFT_IRIS) draw.drawConnectors(landmarks, FL.FACE_LANDMARKS_LEFT_IRIS, { color: "rgba(255,255,255,0.9)", lineWidth: 1 });
            if (FL.FACE_LANDMARKS_RIGHT_IRIS) draw.drawConnectors(landmarks, FL.FACE_LANDMARKS_RIGHT_IRIS, { color: "rgba(255,255,255,0.9)", lineWidth: 1 });
          } catch {
            ctx.fillStyle = "rgba(31,111,255,0.7)";
            for (let i = 0; i < landmarks.length; i += 2) {
              ctx.fillRect(landmarks[i].x * canvas.width, landmarks[i].y * canvas.height, 1.6, 1.6);
            }
          }

          setDiag(`Visage détecté · ${landmarks.length} points`);
          const m = measureFace(landmarks, video.videoWidth, video.videoHeight);
          if (m && m.pupillaryDistanceMm > 40 && m.pupillaryDistanceMm < 95) {
            samplesRef.current.push(m);
            const p = Math.min(100, Math.round((samplesRef.current.length / TARGET_FRAMES) * 100));
            setProgress(p);
            if (samplesRef.current.length >= TARGET_FRAMES) {
              finalize();
              return;
            }
          }
        } else {
          noFaceRef.current += 1;
          if (noFaceRef.current === 8) setDiag("Recherche d'un visage… centrez-vous, bonne lumière.");
          // Repli CPU si le GPU ne détecte rien.
          if (noFaceRef.current >= NO_FACE_RETRY && !cpuTriedRef.current && !switchingRef.current) {
            cpuTriedRef.current = true;
            switchingRef.current = true;
            setDiag("Optimisation du moteur d'analyse…");
            getFaceLandmarker("CPU")
              .then(({ landmarker, vision: v }) => {
                lmRef.current = landmarker;
                visionRef.current = v;
                noFaceRef.current = 0;
              })
              .catch(() => {})
              .finally(() => (switchingRef.current = false));
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [finalize]);

  const startCamera = useCallback(async () => {
    setMode("camera");
    setStatus("loading");
    setError(null);
    setDiag("");
    samplesRef.current = [];
    noFaceRef.current = 0;
    cpuTriedRef.current = false;
    setProgress(0);
    try {
      const { landmarker, vision } = await getFaceLandmarker("GPU");
      lmRef.current = landmarker;
      visionRef.current = vision;
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
      setError(
        "Impossible d'accéder à la caméra ou de charger l'analyse. Téléversez une photo ou choisissez votre forme manuellement."
      );
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

      // Tente GPU puis CPU.
      let landmarks: any = null;
      for (const delegate of ["GPU", "CPU"] as const) {
        try {
          const { landmarker } = await getImageLandmarker(delegate);
          const result = landmarker.detect(img);
          landmarks = result?.faceLandmarks?.[0];
          if (landmarks) break;
        } catch {
          /* essaie le délégué suivant */
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

  if (mode === "manual") {
    return (
      <div>
        <h3 className="font-display text-lg font-semibold">Choisissez la forme la plus proche</h3>
        <p className="mt-2 text-sm text-muted">
          Pas de caméra ? Sélectionnez votre morphologie — vous pourrez l'affiner plus tard.
        </p>
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
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between text-xs text-white">
              <span>{diag || "Maintenez votre visage face caméra…"}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-accent-blue transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}

      {mode === "idle" || status === "error" ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={startCamera} className="gap-2">
            <Camera className="h-4 w-4" /> Activer la caméra
          </Button>
          <label>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-foreground/25 px-7 text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
              <Upload className="h-4 w-4" /> Téléverser une photo
            </span>
          </label>
          <Button variant="ghost" className="gap-2" onClick={() => setMode("manual")}>
            <SlidersHorizontal className="h-4 w-4" /> Choisir manuellement
          </Button>
        </div>
      ) : status === "scanning" ? (
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" className="gap-2 text-muted" onClick={() => setMode("manual")}>
            <SlidersHorizontal className="h-4 w-4" /> La détection bloque ? Choisir manuellement
          </Button>
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-muted">
        L'analyse s'effectue dans votre navigateur. Aucune image n'est envoyée sans votre accord.
      </p>
    </div>
  );
}
