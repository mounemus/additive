/**
 * Chargement paresseux de MediaPipe FaceLandmarker (tasks-vision) depuis le CDN,
 * côté navigateur uniquement. 478 landmarks (iris inclus) pour la calibration
 * millimétrique. Aucune image ne quitte l'appareil : tout est traité localement.
 */

const VISION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let cached: Promise<any> | null = null;

export async function loadVision(): Promise<any> {
  // @ts-expect-error — module ESM distant sans types
  const vision = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/vision_bundle.mjs");
  return vision;
}

/** Crée (et met en cache) un FaceLandmarker en mode VIDEO. */
export function getFaceLandmarker(): Promise<any> {
  if (cached) return cached;
  cached = (async () => {
    const vision = await loadVision();
    const { FaceLandmarker, FilesetResolver } = vision;
    const fileset = await FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);
    const landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    return { landmarker, vision };
  })();
  return cached;
}

/** FaceLandmarker en mode IMAGE (analyse d'une photo téléversée, one-shot). */
export async function getImageLandmarker(): Promise<any> {
  const vision = await loadVision();
  const { FaceLandmarker, FilesetResolver } = vision;
  const fileset = await FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);
  const landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: false,
  });
  return { landmarker, vision };
}
