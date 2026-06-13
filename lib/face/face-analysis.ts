/**
 * Analyse morphologique à partir des landmarks MediaPipe FaceMesh (478 points,
 * iris inclus). Tout est calculé localement (navigateur) — aucune image n'est
 * transmise. Les mesures sont calibrées sur le diamètre réel de l'iris.
 *
 * Référence anatomique : diamètre de l'iris humain ≈ 11,7 mm (stable d'un
 * individu à l'autre) → sert d'étalon pour convertir les pixels en mm.
 */

import type { FaceShape } from "@/lib/configurator";

const IRIS_DIAMETER_MM = 11.7;

export type Landmark = { x: number; y: number; z?: number };

// Indices MediaPipe FaceMesh (canonical 468 + iris 468–477).
const IDX = {
  leftIris: [468, 469, 470, 471, 472],
  rightIris: [473, 474, 475, 476, 477],
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  templeL: 127,
  templeR: 356,
  cheekL: 234,
  cheekR: 454,
  jawL: 172,
  jawR: 397,
  chin: 152,
  foreheadTop: 10,
  browL: 105,
  browR: 334,
  noseBridgeL: 193,
  noseBridgeR: 417,
};

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function center(points: Landmark[]): Landmark {
  const n = points.length;
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  };
}

function irisDiameterPx(lm: Landmark[], ring: number[]): number {
  // Diamètre estimé : double du rayon moyen du cercle d'iris.
  const pts = ring.map((i) => lm[i]).filter(Boolean);
  if (pts.length < 4) return 0;
  const c = center(pts);
  const r = pts.reduce((s, p) => s + dist(c, p), 0) / pts.length;
  return r * 2;
}

export type FaceMeasurements = {
  pupillaryDistanceMm: number;
  faceWidthMm: number;
  faceHeightMm: number;
  jawWidthMm: number;
  foreheadWidthMm: number;
  cheekWidthMm: number;
  noseBridgeMm: number;
  templeWidthMm: number;
};

/** Convertit un jeu de landmarks (coordonnées en pixels) en mesures mm. */
export function measureFace(
  lm: Landmark[],
  width: number,
  height: number
): FaceMeasurements | null {
  if (!lm || lm.length < 478) return null;

  // Landmarks MediaPipe sont normalisés (0–1) → pixels.
  const P = (i: number): Landmark => ({ x: lm[i].x * width, y: lm[i].y * height });

  const irisL = IDX.leftIris.map((i) => ({ x: lm[i].x * width, y: lm[i].y * height }));
  const irisR = IDX.rightIris.map((i) => ({ x: lm[i].x * width, y: lm[i].y * height }));
  const dL = irisDiameterPx(scaleAll(lm, width, height), IDX.leftIris);
  const dR = irisDiameterPx(scaleAll(lm, width, height), IDX.rightIris);
  const irisPx = (dL + dR) / 2;
  if (!irisPx) return null;

  const mmPerPx = IRIS_DIAMETER_MM / irisPx;

  const pd = dist(center(irisL), center(irisR)) * mmPerPx;
  const faceWidth = dist(P(IDX.cheekL), P(IDX.cheekR)) * mmPerPx;
  const faceHeight = dist(P(IDX.foreheadTop), P(IDX.chin)) * mmPerPx;
  const jawWidth = dist(P(IDX.jawL), P(IDX.jawR)) * mmPerPx;
  const foreheadWidth = dist(P(IDX.browL), P(IDX.browR)) * mmPerPx * 1.6;
  const cheekWidth = dist(P(IDX.cheekL), P(IDX.cheekR)) * mmPerPx;
  const templeWidth = dist(P(IDX.templeL), P(IDX.templeR)) * mmPerPx;
  const noseBridge = dist(P(IDX.noseBridgeL), P(IDX.noseBridgeR)) * mmPerPx;

  return {
    pupillaryDistanceMm: round1(pd),
    faceWidthMm: round1(faceWidth),
    faceHeightMm: round1(faceHeight),
    jawWidthMm: round1(jawWidth),
    foreheadWidthMm: round1(foreheadWidth),
    cheekWidthMm: round1(cheekWidth),
    noseBridgeMm: round1(noseBridge),
    templeWidthMm: round1(templeWidth),
  };
}

function scaleAll(lm: Landmark[], w: number, h: number): Landmark[] {
  return lm.map((p) => ({ x: p.x * w, y: p.y * h }));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Classe la forme du visage à partir des proportions mesurées. */
export function classifyShape(m: FaceMeasurements): FaceShape {
  const ratioHW = m.faceHeightMm / m.faceWidthMm; // hauteur / largeur
  const jawVsCheek = m.jawWidthMm / m.cheekWidthMm;
  const foreheadVsCheek = m.foreheadWidthMm / m.cheekWidthMm;

  if (ratioHW >= 1.5) return "allonge";
  // Pommettes nettement plus larges que front ET mâchoire → diamant.
  if (foreheadVsCheek < 0.92 && jawVsCheek < 0.92) return "diamant";
  // Front large, mâchoire fine → cœur.
  if (foreheadVsCheek > 1.03 && jawVsCheek < 0.9) return "coeur";
  // Mâchoire marquée, proportions proches du carré → carré.
  if (jawVsCheek > 0.93 && ratioHW < 1.25) return "carre";
  // Largeur ≈ hauteur, traits doux → rond.
  if (ratioHW < 1.2) return "rond";
  return "ovale";
}

/** Recommandation de chausse (PD → écart, largeur → taille de monture). */
export function chasseRecommendation(m: FaceMeasurements): {
  frameWidth: string;
  bridge: string;
  note: string;
} {
  let frameWidth: string;
  if (m.faceWidthMm < 130) frameWidth = "Monture étroite (≈ 125 mm de large)";
  else if (m.faceWidthMm < 145) frameWidth = "Monture moyenne (≈ 135 mm de large)";
  else frameWidth = "Monture large (≈ 145 mm de large)";

  const bridge =
    m.noseBridgeMm < 16
      ? "Pont étroit (≈ 16 mm)"
      : m.noseBridgeMm < 19
        ? "Pont standard (≈ 17–18 mm)"
        : "Pont large (≈ 20 mm)";

  return {
    frameWidth,
    bridge,
    note: `Écart pupillaire ≈ ${m.pupillaryDistanceMm} mm — centrage optique calibré sur cette valeur.`,
  };
}

/** Moyenne robuste d'une série de mesures (atténue le bruit frame à frame). */
export function averageMeasurements(series: FaceMeasurements[]): FaceMeasurements | null {
  if (!series.length) return null;
  const keys = Object.keys(series[0]) as (keyof FaceMeasurements)[];
  const out = {} as FaceMeasurements;
  for (const k of keys) {
    const vals = series.map((s) => s[k]).sort((a, b) => a - b);
    // Médiane tronquée (ignore les 20 % extrêmes).
    const lo = Math.floor(vals.length * 0.2);
    const hi = Math.ceil(vals.length * 0.8);
    const slice = vals.slice(lo, Math.max(hi, lo + 1));
    out[k] = round1(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  return out;
}

export const MEASUREMENT_LABELS: Record<keyof FaceMeasurements, string> = {
  pupillaryDistanceMm: "Écart pupillaire",
  faceWidthMm: "Largeur du visage",
  faceHeightMm: "Hauteur du visage",
  jawWidthMm: "Largeur mâchoire",
  foreheadWidthMm: "Largeur du front",
  cheekWidthMm: "Largeur pommettes",
  noseBridgeMm: "Pont nasal",
  templeWidthMm: "Largeur tempes",
};
