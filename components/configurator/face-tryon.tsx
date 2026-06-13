"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, ImageDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFaceLandmarker } from "@/lib/face/mediapipe";
import { demoFrameOverlaySvg } from "@/lib/ai/demo-visuals";

/**
 * Essayage par superposition : la monture (PNG/SVG de façade transparent) est
 * ancrée en temps réel aux tempes et à la ligne des yeux via les landmarks
 * MediaPipe. « Capturer mon essayage » enregistre une photo souvenir.
 * Tout reste local au navigateur.
 */
export function FaceTryon({
  paletteColors,
  onCapture,
}: {
  paletteColors: string[];
  onCapture: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const lmRef = useRef<any>(null);
  const noFaceRef = useRef(0);
  const cpuTriedRef = useRef(false);
  const switchingRef = useRef(false);

  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");

  const cleanup = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // Prépare l'image de façade transparente (couleur = palette du concept).
  useEffect(() => {
    const img = new window.Image();
    img.src = demoFrameOverlaySvg(paletteColors);
    img.onload = () => (frameImgRef.current = img);
  }, [paletteColors]);

  const loop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const lm = lmRef.current;
    if (!runningRef.current || !video || !canvas || !lm) return;

    if (video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        let result;
        try {
          result = lm.detectForVideo(video, performance.now());
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
        } else if (landmarks && frame) {
          noFaceRef.current = 0;
          const W = canvas.width;
          const H = canvas.height;
          // Tempes gauche (127) et droite (356) → largeur + angle de la monture.
          const tL = landmarks[127];
          const tR = landmarks[356];
          const eyeL = landmarks[33];
          const eyeR = landmarks[263];
          const x1 = tL.x * W;
          const y1 = tL.y * H;
          const x2 = tR.x * W;
          const y2 = tR.y * H;
          const cx = (x1 + x2) / 2;
          const cy = ((eyeL.y + eyeR.y) / 2) * H;
          const width = Math.hypot(x2 - x1, y2 - y1) * 1.06;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const ratio = frame.naturalHeight / frame.naturalWidth;
          const height = width * ratio;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.drawImage(frame, -width / 2, -height / 2, width, height);
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

  return (
    <div>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-0" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <Camera className="h-12 w-12" />
            <p className="text-sm">Essayage sur votre visage</p>
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
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {status !== "live" ? (
          <Button onClick={start} className="gap-2">
            <Camera className="h-4 w-4" /> Lancer l'essayage
          </Button>
        ) : (
          <Button onClick={capture} variant="accent" className="gap-2">
            <ImageDown className="h-4 w-4" /> Capturer mon essayage
          </Button>
        )}
      </div>
    </div>
  );
}
