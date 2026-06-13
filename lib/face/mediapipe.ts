/**
 * Chargement paresseux de MediaPipe FaceLandmarker (tasks-vision) depuis le CDN,
 * côté navigateur uniquement. 478 landmarks (iris inclus) pour la calibration
 * millimétrique. Aucune image ne quitte l'appareil : tout est traité localement.
 *
 * Le délégué GPU est rapide mais échoue silencieusement sur certains drivers ;
 * on expose donc le choix GPU/CPU avec repli automatique côté composant.
 */

const VISION_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Delegate = "GPU" | "CPU";

export async function loadVision(): Promise<any> {
  // @ts-expect-error — module ESM distant sans types
  const vision = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/vision_bundle.mjs");
  return vision;
}

const videoCache: Partial<Record<Delegate, Promise<any>>> = {};

/** FaceLandmarker en mode VIDEO (mis en cache par délégué). */
export function getFaceLandmarker(delegate: Delegate = "GPU"): Promise<any> {
  if (videoCache[delegate]) return videoCache[delegate]!;
  videoCache[delegate] = (async () => {
    const vision = await loadVision();
    const { FaceLandmarker, FilesetResolver } = vision;
    const fileset = await FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);
    const landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    return { landmarker, vision };
  })();
  return videoCache[delegate]!;
}

/** FaceLandmarker en mode IMAGE (analyse d'une photo téléversée, one-shot). */
export async function getImageLandmarker(delegate: Delegate = "GPU"): Promise<any> {
  const vision = await loadVision();
  const { FaceLandmarker, FilesetResolver } = vision;
  const fileset = await FilesetResolver.forVisionTasks(`${VISION_CDN}/wasm`);
  const landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "IMAGE",
    numFaces: 1,
    outputFaceBlendshapes: false,
  });
  return { landmarker, vision };
}
