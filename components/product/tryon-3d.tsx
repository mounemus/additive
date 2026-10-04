"use client";

import { withBase } from "@/lib/base-path";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Camera, ImageDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFaceLandmarker, getImageLandmarker } from "@/lib/face/mediapipe";
import { loadImage } from "@/components/configurator/face-tryon";

/**
 * Essayage 3D WebGL (Three.js pur) : le MODÈLE GLB ENTIER du produit
 * (façade + branches) est posé sur le visage façon Zenni/Fittingbox.
 *
 * Fiabilité — le placement est AUTO-CALIBRÉ à chaque frame, sans constante
 * anthropométrique mémorisée : les landmarks 2D observés (tempes 234/454,
 * sellion 168) sont rétro-projetés en espace caméra à la profondeur donnée
 * par la matrice de transformation faciale MediaPipe, puis ramenés en espace
 * LOCAL du visage via la matrice inverse. Comme le rendu repasse par la même
 * caméra, la projection des lunettes recoïncide par construction avec les
 * landmarks observés — même si le FOV réel de la webcam diffère du FOV
 * supposé (~63°).
 *
 * Occlusion (le « secret » Zenni) : un ellipsoïde tête (colorWrite:false,
 * depthWrite:true, rendu avant les lunettes) remplit le depth-buffer → les
 * branches disparaissent derrière le crâne quand la tête tourne.
 *
 * Vue miroir : la vidéo ET le canvas WebGL sont retournés en CSS
 * (-scale-x-100). La scène est rendue non-miroir (pas d'inversion de
 * chiralité des matrices) ; la capture recompose le miroir manuellement.
 */

// ── Constantes ───────────────────────────────────────────────────────────────

/** FOV vertical supposé par la géométrie faciale MediaPipe (degrés). */
const FOV_DEG = 63;
/** Landmarks : tempes gauche/droite et sellion (racine du nez). */
const LM_TEMPLE_L = 234;
const LM_TEMPLE_R = 454;
const LM_SELLION = 168;
/** Largeur totale de la monture vs écart des tempes (charnières incluses). */
const WIDTH_FACTOR = 1.04;
/** Offsets du pont vs sellion, en fraction de l'écart des tempes. */
const BRIDGE_DOWN = 0.02; // le pont s'assoit légèrement sous le sellion
const BRIDGE_FWD = 0.08; // distance verre-œil (~12 mm pour d≈145 mm)
/** Ellipsoïde occlusion tête : rayons en fraction de l'écart des tempes. */
const OCC_RX = 0.47; // < 0.5 : ne mange pas les branches qui longent les tempes
const OCC_RY = 0.65;
const OCC_RZ = 0.55;

type Lm = { x: number; y: number; z: number };
type Adjust = { w: number; h: number };

const S3D = {
  fr: {
    start: "Essayer sur mon visage",
    capture: "Capturer mon essayage",
    cameraError: "Caméra indisponible. Vous pouvez tout de même utiliser la vue studio.",
    modelLoading: "Chargement du modèle 3D…",
    analyzing: "Analyse de la photo…",
    noFace: "Aucun visage détecté — essayez une photo de face, bien éclairée.",
    download: "Télécharger",
    photoAlt: "Essayage 3D de la monture sur votre photo",
  },
  en: {
    start: "Try on my face",
    capture: "Capture my try-on",
    cameraError: "Camera unavailable. You can still use the studio view.",
    modelLoading: "Loading 3D model…",
    analyzing: "Analyzing your photo…",
    noFace: "No face detected — try a well-lit, front-facing photo.",
    download: "Download",
    photoAlt: "3D frame try-on over your photo",
  },
} as const;

// ── Filtre One-Euro (stable à l'arrêt, réactif en mouvement) ─────────────────

function oneEuro(minCutoff: number, beta: number, dCutoff = 1) {
  let xPrev: number | null = null;
  let dxPrev = 0;
  let tPrev = 0;
  const alpha = (cutoff: number, dt: number) => {
    const r = 2 * Math.PI * cutoff * dt;
    return r / (r + 1);
  };
  const f = (x: number, t: number) => {
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
  f.reset = () => {
    xPrev = null;
    dxPrev = 0;
  };
  return f;
}

type Euro = ReturnType<typeof oneEuro>;

// ── Cache du GLB (ArrayBuffer partagé entre live et photo) ───────────────────

const glbCache = new Map<string, Promise<ArrayBuffer>>();

function fetchGlb(url: string): Promise<ArrayBuffer> {
  let p = glbCache.get(url);
  if (!p) {
    p = fetch(withBase(url)).then((res) => {
      if (!res.ok) throw new Error(`glb ${res.status}`);
      return res.arrayBuffer();
    });
    p.catch(() => glbCache.delete(url)); // échec → retenter plus tard
    glbCache.set(url, p);
  }
  return p;
}

// ── Normalisation du modèle : orientation, pivot pont, largeur ───────────────

function samplePoints(obj: THREE.Object3D, out: THREE.Vector3[]) {
  obj.updateMatrixWorld(true);
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const attr = mesh.geometry?.getAttribute("position");
    if (!attr) return;
    const step = Math.max(1, Math.floor(attr.count / 400));
    for (let i = 0; i < attr.count; i += step) {
      out.push(new THREE.Vector3().fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld));
    }
  });
}

/**
 * Oriente et centre le GLB : largeur → X, façade → +Z, pivot = centre du
 * PONT (plan avant, entre les verres). Heuristique d'orientation : l'axe des
 * branches a un centroïde de sommets nettement décalé vers la façade (rims
 * massifs à une extrémité, branches fines à l'autre) alors que l'axe de la
 * largeur est symétrique. Retourne le groupe pivot et la largeur mesurée.
 */
function normalizeGlasses(root: THREE.Group): { pivot: THREE.Group; width: number } {
  const pts: THREE.Vector3[] = [];
  samplePoints(root, pts);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const centroid = new THREE.Vector3();
  for (const p of pts) centroid.add(p);
  if (pts.length) centroid.divideScalar(pts.length);

  const offX = Math.abs(centroid.x - center.x) / (size.x || 1);
  const offZ = Math.abs(centroid.z - center.z) / (size.z || 1);

  const oriented = new THREE.Group();
  oriented.add(root);
  if (offX > offZ * 1.15) {
    // Largeur le long de Z, branches le long de X : façade du côté du
    // centroïde. -90° amène +X→+Z ; +90° amène -X→+Z.
    oriented.rotation.y = centroid.x > center.x ? -Math.PI / 2 : Math.PI / 2;
  } else if (centroid.z < center.z) {
    oriented.rotation.y = Math.PI; // façade à -Z → demi-tour
  }

  // Re-mesure après orientation.
  const pts2: THREE.Vector3[] = [];
  samplePoints(oriented, pts2);
  const box2 = new THREE.Box3().setFromObject(oriented);
  const size2 = box2.getSize(new THREE.Vector3());
  const center2 = box2.getCenter(new THREE.Vector3());

  // Zone du pont : sommets centraux en X, dans le tiers avant en Z (les
  // branches n'ont pas de sommets près de x=0 → seule la façade est retenue).
  // En Y, le PONT est la partie HAUTE de cette zone centrale (les verres
  // pendent dessous) : 85ᵉ percentile — un pivot à mi-hauteur poserait la
  // monture trop haut (façade à cheval sur les sourcils).
  const centralYs: number[] = [];
  let sz = 0;
  for (const p of pts2) {
    if (Math.abs(p.x - center2.x) < size2.x * 0.15 && p.z > box2.max.z - size2.z * 0.35) {
      centralYs.push(p.y);
      sz += p.z;
    }
  }
  let bridgeY = center2.y + size2.y * 0.25;
  if (centralYs.length) {
    centralYs.sort((a, b) => a - b);
    bridgeY = centralYs[Math.min(centralYs.length - 1, Math.floor(centralYs.length * 0.85))];
  }
  const bridgeZ = centralYs.length ? sz / centralYs.length : box2.max.z;

  const shift = new THREE.Group();
  shift.add(oriented);
  shift.position.set(-center2.x, -bridgeY, -bridgeZ);
  const pivot = new THREE.Group();
  pivot.add(shift);
  return { pivot, width: size2.x > 0 ? size2.x : 1 };
}

// ── Moteur de scène ──────────────────────────────────────────────────────────

export class TryonEngine {
  readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  /** Groupe piloté par la matrice de transformation faciale (lissée). */
  private faceGroup = new THREE.Group();
  /** Porte-lunettes : ancrage local (sellion) + échelle calibrée. */
  private holder = new THREE.Group();
  private occluder: THREE.Mesh;
  private model: THREE.Group | null = null;
  private modelWidth = 1;
  private frameMats: Array<THREE.MeshStandardMaterial> = [];
  private lensMats: Array<THREE.MeshStandardMaterial> = [];
  private envTexture: THREE.Texture | null = null;
  private draco: DRACOLoader | null = null;
  private disposed = false;
  private viewW = 0;
  private viewH = 0;

  // Lissage : position/quaternion du visage, écart tempes, ancres locales.
  private filters: Record<string, Euro>;
  private smQuat = new THREE.Quaternion();
  private hasQuat = false;

  // Scratch (aucune allocation par frame).
  private _m = new THREE.Matrix4();
  private _minv = new THREE.Matrix4();
  private _pos = new THREE.Vector3();
  private _quat = new THREE.Quaternion();
  private _scl = new THREE.Vector3();
  private _vL = new THREE.Vector3();
  private _vR = new THREE.Vector3();
  private _vS = new THREE.Vector3();
  private _vE = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.camera = new THREE.PerspectiveCamera(FOV_DEG, 4 / 3, 1, 10000);

    // Éclairage studio léger + environnement neutre généré localement
    // (RoomEnvironment) : indispensable pour les matériaux métalliques.
    const hemi = new THREE.HemisphereLight(0xffffff, 0x555555, 0.7);
    const dir = new THREE.DirectionalLight(0xffffff, 1.3);
    dir.position.set(30, 60, 120);
    this.scene.add(hemi, dir);
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const room = new RoomEnvironment();
      this.envTexture = pmrem.fromScene(room, 0.04).texture;
      this.scene.environment = this.envTexture;
      pmrem.dispose();
    } catch {
      // Sans environnement, l'éclairage hemi+dir reste suffisant.
    }

    this.faceGroup.matrixAutoUpdate = false;
    this.scene.add(this.faceGroup);
    this.faceGroup.add(this.holder);

    // Occluder tête : écrit UNIQUEMENT la profondeur, rendu avant tout —
    // les branches derrière le crâne échouent au depth-test → invisibles.
    const occMat = new THREE.MeshBasicMaterial();
    occMat.colorWrite = false;
    this.occluder = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), occMat);
    this.occluder.renderOrder = -10;
    this.occluder.frustumCulled = false;
    this.faceGroup.add(this.occluder);
    this.setVisible(false);

    this.filters = this.makeFilters();
  }

  private makeFilters(): Record<string, Euro> {
    return {
      px: oneEuro(2.2, 0.5),
      py: oneEuro(2.2, 0.5),
      pz: oneEuro(1.6, 0.4),
      qx: oneEuro(1.2, 0.5),
      qy: oneEuro(1.2, 0.5),
      qz: oneEuro(1.2, 0.5),
      qw: oneEuro(1.2, 0.5),
      d: oneEuro(0.6, 0.2),
      ax: oneEuro(2.0, 0.5),
      ay: oneEuro(2.0, 0.5),
      az: oneEuro(1.2, 0.4),
      ex: oneEuro(1.6, 0.4),
      ey: oneEuro(1.6, 0.4),
      ez: oneEuro(1.2, 0.4),
    };
  }

  setViewport(w: number, h: number) {
    if (this.disposed || (w === this.viewW && h === this.viewH)) return;
    this.viewW = w;
    this.viewH = h;
    // pixelRatio plafonné (netteté vs coût fill-rate sur grands flux vidéo).
    const ratio = Math.min(
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      2,
      Math.max(1, 1920 / Math.max(w, h))
    );
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  async loadModel(url: string): Promise<void> {
    const buffer = await fetchGlb(url);
    if (this.disposed) return;
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath(withBase("/draco/"));
    const loader = new GLTFLoader();
    loader.setDRACOLoader(this.draco);
    const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
      loader.parse(buffer.slice(0), "", resolve as (g: unknown) => void, reject);
    });
    if (this.disposed) {
      disposeObject(gltf.scene);
      return;
    }
    this.setupModel(gltf.scene);
  }

  private setupModel(root: THREE.Group) {
    this.frameMats = [];
    this.lensMats = [];
    const seen = new Set<THREE.Material>();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.frustumCulled = false; // groupe posé par matrice manuelle
      const source = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const cloned = source.map((m) => {
        if (seen.has(m)) return m; // déjà cloné (partagé entre meshes)
        const c = m.clone();
        seen.add(c);
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0];
      let allLens = cloned.length > 0;
      for (const m of cloned) {
        const std = m as THREE.MeshPhysicalMaterial;
        const label = `${mesh.name} ${m.name}`.toLowerCase();
        const isLens =
          /lens|verre|glass|vitre|crystal|optic/.test(label) ||
          (typeof std.transmission === "number" && std.transmission > 0.01) ||
          (m.transparent && (m.opacity ?? 1) < 0.9);
        if (isLens && std.color) {
          // Verres : transparence simple et fiable (la transmission physique
          // n'a rien à réfracter au-dessus d'un fond vidéo transparent).
          if (typeof std.transmission === "number") std.transmission = 0;
          std.transparent = true;
          std.opacity = Math.min(std.opacity && std.opacity < 1 ? std.opacity : 0.35, 0.35);
          std.depthWrite = false;
          std.side = THREE.DoubleSide;
          this.lensMats.push(std);
        } else {
          allLens = false;
          const fm = m as THREE.MeshStandardMaterial;
          if (fm.color) {
            fm.userData.__origColor = fm.color.getHex();
            this.frameMats.push(fm);
          }
        }
      }
      if (allLens) mesh.renderOrder = 5; // verres après la monture
    });

    const { pivot, width } = normalizeGlasses(root);
    this.model = pivot;
    this.modelWidth = width;
    this.holder.add(pivot);
  }

  /** Recolore la monture (multiplie les textures) ; null → couleurs d'origine. */
  setFrameColor(hex: string | null) {
    for (const m of this.frameMats) {
      if (hex) m.color.set(hex);
      else if (typeof m.userData.__origColor === "number") m.color.setHex(m.userData.__origColor);
    }
  }

  /** Teinte optionnelle des verres ; null → teinte d'origine du modèle. */
  setLensTint(hex: string | null) {
    for (const m of this.lensMats) {
      if (hex) m.color.set(hex);
      else if (typeof m.userData.__origColor === "number") m.color.setHex(m.userData.__origColor);
    }
  }

  setVisible(v: boolean) {
    this.faceGroup.visible = v;
  }

  get hasModel(): boolean {
    return this.model !== null;
  }

  /**
   * Applique la pose du visage. `matrix` = facialTransformationMatrix 4x4
   * colonne-major (espace visage → espace caméra, cm). `lms` = landmarks
   * normalisés. `immediate` (photo / première frame) : sans lissage.
   */
  updateFromFace(
    matrix: ArrayLike<number>,
    lms: Lm[],
    W: number,
    H: number,
    adj: Adjust,
    ts: number,
    immediate: boolean
  ) {
    if (this.disposed || !this.model) return;
    const M = this._m.fromArray(Array.from(matrix));
    M.decompose(this._pos, this._quat, this._scl);
    this._minv.copy(M).invert();

    const fpx = H / 2 / Math.tan(THREE.MathUtils.degToRad(FOV_DEG) / 2);
    const depth = Math.max(1, Math.abs(this._pos.z));

    // Rétro-projection d'un landmark 2D en espace LOCAL du visage : rayon
    // caméra à la profondeur (matrice + z relatif du landmark), puis M⁻¹.
    const local = (i: number, out: THREE.Vector3) => {
      const lm = lms[i];
      const di = Math.max(1, depth + lm.z * W * (depth / fpx));
      const k = di / fpx;
      out.set((lm.x - 0.5) * W * k, (0.5 - lm.y) * H * k, -di);
      return out.applyMatrix4(this._minv);
    };
    local(LM_TEMPLE_L, this._vL);
    local(LM_TEMPLE_R, this._vR);
    local(LM_SELLION, this._vS);
    this._vE.copy(this._vL).add(this._vR).multiplyScalar(0.5); // mi-tempes
    const dRaw = this._vL.distanceTo(this._vR);

    const f = this.filters;
    if (immediate) {
      for (const key of Object.keys(f)) f[key].reset();
      this.smQuat.copy(this._quat);
      this.hasQuat = true;
    }

    const px = f.px(this._pos.x, ts);
    const py = f.py(this._pos.y, ts);
    const pz = f.pz(this._pos.z, ts);
    if (!this.hasQuat) {
      this.smQuat.copy(this._quat);
      this.hasQuat = true;
    }
    // Lissage quaternion composante à composante (One-Euro) : signe réconcilié
    // (q et -q = même rotation) puis renormalisation.
    if (this.smQuat.dot(this._quat) < 0) {
      this._quat.set(-this._quat.x, -this._quat.y, -this._quat.z, -this._quat.w);
    }
    this.smQuat
      .set(
        f.qx(this._quat.x, ts),
        f.qy(this._quat.y, ts),
        f.qz(this._quat.z, ts),
        f.qw(this._quat.w, ts)
      )
      .normalize();
    const d = Math.max(1e-3, f.d(dRaw, ts));
    const ax = f.ax(this._vS.x, ts);
    const ay = f.ay(this._vS.y, ts);
    const az = f.az(this._vS.z, ts);
    const ex = f.ex(this._vE.x, ts);
    const ey = f.ey(this._vE.y, ts);
    const ez = f.ez(this._vE.z, ts);

    this._pos.set(px, py, pz);
    this.faceGroup.matrix.compose(this._pos, this.smQuat, this._scl);

    // Échelle : largeur monture = écart des tempes × facteur ± réglage user.
    const w = Math.max(-50, Math.min(50, adj.w));
    const h = Math.max(-50, Math.min(50, adj.h));
    const scale = (d * WIDTH_FACTOR * (1 + w / 200)) / this.modelWidth;
    this.holder.scale.setScalar(scale);
    // Ancrage : pont sur le sellion, légèrement dessous et en avant (distance
    // verre-œil) ; réglage Hauteur = offset vertical (h>0 → vers le bas).
    this.holder.position.set(ax, ay - d * (BRIDGE_DOWN + h / 400), az + d * BRIDGE_FWD);

    // Ellipsoïde tête : centré entre les tempes en x/y (un peu au-dessus, le
    // crâne déborde de la ligne des tragions), mais RECULÉ en z pour que sa
    // face avant reste STRICTEMENT derrière le plan de la façade — sinon il
    // remplirait le depth-buffer devant les verres et masquerait la monture
    // entière. Front de l'ellipsoïde ≈ plan façade - 2 % de d.
    const zFront = az + d * BRIDGE_FWD;
    this.occluder.position.set(ex, ey + d * 0.05, zFront - d * (0.02 + OCC_RZ));
    this.occluder.scale.set(d * OCC_RX, d * OCC_RY, d * OCC_RZ);
  }

  render() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    disposeObject(this.scene);
    this.envTexture?.dispose();
    this.draco?.dispose();
    this.renderer.dispose();
  }
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m) continue;
      for (const value of Object.values(m)) {
        if (value && (value as THREE.Texture).isTexture) (value as THREE.Texture).dispose();
      }
      m.dispose();
    }
  });
}

// ── Essayage 3D EN DIRECT ────────────────────────────────────────────────────

export function Tryon3DLive({
  modelUrl,
  frameColor,
  lensTint,
  onCapture,
  onFatal,
  locale = "fr",
  widthAdjust = 0,
  heightAdjust = 0,
}: {
  modelUrl: string;
  /** Couleur monture (hex) appliquée au matériau principal ; null = origine. */
  frameColor?: string | null;
  /** Teinte optionnelle des verres (hex). */
  lensTint?: string | null;
  onCapture: (dataUrl: string) => void;
  /** Erreur fatale (WebGL/GLB) → le parent bascule sur l'essayage 2D. */
  onFatal: () => void;
  locale?: "fr" | "en";
  widthAdjust?: number;
  heightAdjust?: number;
}) {
  const s = S3D[locale] ?? S3D.fr;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TryonEngine | null>(null);
  const lmRef = useRef<any>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const noFaceRef = useRef(0);
  const cpuTriedRef = useRef(false);
  const switchingRef = useRef(false);
  const firstPoseRef = useRef(true);
  const adjRef = useRef<Adjust>({ w: 0, h: 0 });
  const onFatalRef = useRef(onFatal);
  onFatalRef.current = onFatal;

  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    adjRef.current = { w: widthAdjust, h: heightAdjust };
  }, [widthAdjust, heightAdjust]);

  // Moteur Three.js : créé au montage, détruit au démontage (dispose complet).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let engine: TryonEngine;
    try {
      engine = new TryonEngine(canvas);
    } catch {
      onFatalRef.current();
      return;
    }
    engineRef.current = engine;
    const onLost = (e: Event) => {
      e.preventDefault();
      onFatalRef.current();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    engine
      .loadModel(modelUrl)
      // Garde anti-course (StrictMode/remontage) : ne signale « prêt » que si
      // le moteur COURANT porte bien le modèle (pas un moteur déjà disposé).
      .then(() => {
        if (engineRef.current?.hasModel) setModelReady(true);
      })
      .catch(() => onFatalRef.current());
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      engine.dispose();
      engineRef.current = null;
    };
  }, [modelUrl]);

  // Variantes couleur : recoloration en direct sans recharger le modèle.
  useEffect(() => {
    if (modelReady) engineRef.current?.setFrameColor(frameColor ?? null);
  }, [frameColor, modelReady]);
  useEffect(() => {
    if (modelReady) engineRef.current?.setLensTint(lensTint ?? null);
  }, [lensTint, modelReady]);

  // Un SEUL rAF partagé : détection MediaPipe + rendu Three.js.
  const loop = useCallback(() => {
    const video = videoRef.current;
    const engine = engineRef.current;
    const lm = lmRef.current;
    if (!runningRef.current || !video || !engine || !lm) return;

    if (video.readyState >= 2 && video.videoWidth) {
      const W = video.videoWidth;
      const H = video.videoHeight;
      engine.setViewport(W, H);
      const ts = performance.now();
      let result: any = null;
      try {
        result = lm.detectForVideo(video, ts);
      } catch {
        result = null;
      }
      const lms = result?.faceLandmarks?.[0];
      const mat = result?.facialTransformationMatrixes?.[0]?.data;
      if (lms && mat && engine.hasModel) {
        noFaceRef.current = 0;
        engine.setVisible(true);
        engine.updateFromFace(mat, lms, W, H, adjRef.current, ts, firstPoseRef.current);
        firstPoseRef.current = false;
      } else {
        noFaceRef.current += 1;
        // Visage perdu durablement : lunettes masquées (pas de pose figée).
        if (noFaceRef.current > 15) {
          engine.setVisible(false);
          firstPoseRef.current = true;
        }
        // Même repli GPU→CPU que l'essayage 2D (drivers capricieux).
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
      }
      engine.render();
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Pause quand l'onglet est caché (économie batterie/GPU), reprise au retour.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else if (runningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loop]);

  const start = useCallback(async () => {
    setStatus("loading");
    try {
      noFaceRef.current = 0;
      cpuTriedRef.current = false;
      firstPoseRef.current = true;
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
      console.error("[tryon-3d] camera error", e);
      setStatus("error");
    }
  }, [loop]);

  // Coupe caméra + rAF au démontage — confidentialité non négociable.
  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Capture : composite vidéo (miroir) + canvas 3D → JPEG (même flux que 2D).
  const capture = useCallback(() => {
    const video = videoRef.current;
    const engine = engineRef.current;
    if (!video || !engine || !video.videoWidth) return;
    const W = video.videoWidth;
    const H = video.videoHeight;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, W, H);
    engine.render(); // buffer garanti frais au moment du drawImage
    ctx.drawImage(engine.canvas, 0, 0, W, H);
    onCapture(c.toDataURL("image/jpeg", 0.9));
  }, [onCapture]);

  return (
    <div>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
        {/* Vue miroir selfie : vidéo ET canvas 3D retournés en CSS. */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          aria-hidden
        />
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
        {status === "live" && !modelReady && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" /> {s.modelLoading}
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
    </div>
  );
}

// ── Essayage 3D SUR PHOTO (détection unique, pose statique, rendu unique) ────

export function Tryon3DPhoto({
  photo,
  modelUrl,
  frameColor,
  lensTint,
  onFatal,
  locale = "fr",
  widthAdjust = 0,
  heightAdjust = 0,
  slug,
}: {
  photo: string;
  modelUrl: string;
  frameColor?: string | null;
  lensTint?: string | null;
  onFatal: () => void;
  locale?: "fr" | "en";
  widthAdjust?: number;
  heightAdjust?: number;
  slug: string;
}) {
  const s = S3D[locale] ?? S3D.fr;
  const displayRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TryonEngine | null>(null);
  const photoImgRef = useRef<HTMLImageElement | null>(null);
  const detRef = useRef<{ matrix: number[]; lms: Lm[] } | null>(null);
  const onFatalRef = useRef(onFatal);
  onFatalRef.current = onFatal;

  const [detect, setDetect] = useState<"pending" | "ok" | "none">("pending");
  const [ready, setReady] = useState(false); // moteur + modèle prêts

  // Composite : photo puis rendu 3D par-dessus (pas de miroir sur une photo).
  const composite = useCallback(() => {
    const canvas = displayRef.current;
    const img = photoImgRef.current;
    const engine = engineRef.current;
    if (!canvas || !img) return;
    const W = (canvas.width = img.naturalWidth || 1);
    const H = (canvas.height = img.naturalHeight || 1);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, W, H);
    const det = detRef.current;
    if (engine && det && engine.hasModel) {
      engine.setViewport(W, H);
      engine.setVisible(true);
      engine.updateFromFace(
        det.matrix,
        det.lms,
        W,
        H,
        { w: widthAdjust, h: heightAdjust },
        performance.now(),
        true // pose statique : pas de lissage
      );
      engine.render();
      ctx.drawImage(engine.canvas, 0, 0, W, H);
    }
  }, [widthAdjust, heightAdjust]);

  // Moteur Three.js hors-écran (le composite s'affiche dans un canvas 2D).
  useEffect(() => {
    const off = document.createElement("canvas");
    let engine: TryonEngine;
    try {
      engine = new TryonEngine(off);
    } catch {
      onFatalRef.current();
      return;
    }
    engineRef.current = engine;
    engine
      .loadModel(modelUrl)
      // Garde anti-course (StrictMode/remontage) : « prêt » seulement quand
      // le moteur COURANT porte le modèle — sinon la recomposition sur
      // `ready` peut précéder la fin du parse et ne jamais se redéclencher.
      .then(() => {
        if (engineRef.current?.hasModel) setReady(true);
      })
      .catch(() => onFatalRef.current());
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [modelUrl]);

  // Détection UNE seule fois par photo (mode IMAGE, repli GPU → CPU).
  useEffect(() => {
    let cancelled = false;
    setDetect("pending");
    detRef.current = null;
    (async () => {
      try {
        const img = await loadImage(photo);
        if (cancelled) return;
        photoImgRef.current = img;
        composite(); // affiche la photo pendant l'analyse
        let result: any = null;
        try {
          const { landmarker } = await getImageLandmarker("GPU");
          result = landmarker.detect(img);
          landmarker.close?.();
        } catch {
          const { landmarker } = await getImageLandmarker("CPU");
          result = landmarker.detect(img);
          landmarker.close?.();
        }
        if (cancelled) return;
        const lms = result?.faceLandmarks?.[0] ?? null;
        const mat = result?.facialTransformationMatrixes?.[0]?.data ?? null;
        if (lms && mat) {
          detRef.current = { matrix: Array.from(mat as ArrayLike<number>), lms };
          setDetect("ok");
        } else {
          setDetect("none");
        }
        composite();
      } catch {
        if (!cancelled) setDetect("none");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  // Couleurs et re-rendus : sliders/couleur → recomposition instantanée.
  useEffect(() => {
    if (!ready) return;
    engineRef.current?.setFrameColor(frameColor ?? null);
    engineRef.current?.setLensTint(lensTint ?? null);
    composite();
  }, [ready, frameColor, lensTint, detect, composite]);

  const download = useCallback(() => {
    const canvas = displayRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.9);
    a.download = `essayage-photo-${slug}.jpg`;
    a.click();
  }, [slug]);

  return (
    <div>
      <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-[#0a0a0a]">
        <canvas ref={displayRef} className="block h-auto w-full" role="img" aria-label={s.photoAlt} />
        {(detect === "pending" || (detect === "ok" && !ready)) && (
          <div className="absolute left-4 top-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" />
              {detect === "pending" ? s.analyzing : s.modelLoading}
            </span>
          </div>
        )}
      </div>
      {detect === "none" && (
        <p className="mt-3 text-center text-sm text-muted" role="status">
          {s.noFace}
        </p>
      )}
      {detect === "ok" && (
        <div className="mt-5 flex justify-center">
          <Button onClick={download} variant="accent" className="gap-2">
            <ImageDown className="h-4 w-4" />
            {s.download}
          </Button>
        </div>
      )}
    </div>
  );
}
