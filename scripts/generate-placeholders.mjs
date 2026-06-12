/**
 * Génère les visuels SVG placeholder (produits + collections).
 * Usage : node scripts/generate-placeholders.mjs
 * Les fichiers sont des placeholders premium en attendant les vraies
 * photos produits (à téléverser via /admin/media).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PRODUCTS_DIR = join(ROOT, "public", "images", "products");
const COLLECTIONS_DIR = join(ROOT, "public", "images", "collections");
mkdirSync(PRODUCTS_DIR, { recursive: true });
mkdirSync(COLLECTIONS_DIR, { recursive: true });

const ACCENTS = {
  modulair: "#ff6a2a",
  generative: "#1f6fff",
  hybride: "#d8d8d4",
};

const PRODUCTS = [
  ["nexus", "generative"], ["synthesis", "hybride"], ["stellar", "modulair"],
  ["ikona", "generative"], ["skecham", "generative"], ["prodigy", "generative"],
  ["orbit", "generative"], ["haptic", "generative"], ["aurora", "generative"],
  ["cyborg", "modulair"], ["cygnus", "modulair"], ["eclipso", "modulair"],
  ["quantum", "hybride"], ["placeholder", "generative"],
];

function grid(accent) {
  let lines = "";
  for (let i = 0; i <= 12; i++) {
    const x = (i * 1200) / 12;
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="900" stroke="${accent}" stroke-opacity="0.06" stroke-width="1"/>`;
  }
  for (let i = 0; i <= 9; i++) {
    const y = (i * 900) / 9;
    lines += `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="${accent}" stroke-opacity="0.06" stroke-width="1"/>`;
  }
  return lines;
}

function lattice(accent, cx, cy, r, n = 14) {
  let pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + 0.3 * Math.sin(i * 2.7));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6]);
  }
  let out = "";
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if ((i + j) % 3 === 0) {
        out += `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}" stroke="${accent}" stroke-opacity="0.18" stroke-width="1"/>`;
      }
    }
  }
  return out;
}

function glasses(accent) {
  return `
  <g transform="translate(600 450)">
    <g fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round">
      <rect x="-260" y="-70" width="220" height="150" rx="58" />
      <rect x="40" y="-70" width="220" height="150" rx="58" />
      <path d="M -40 -30 C -20 -55, 20 -55, 40 -30" />
      <path d="M -260 -20 L -340 -45" />
      <path d="M 260 -20 L 340 -45" />
    </g>
    <g fill="${accent}" fill-opacity="0.08">
      <rect x="-260" y="-70" width="220" height="150" rx="58" />
      <rect x="40" y="-70" width="220" height="150" rx="58" />
    </g>
  </g>`;
}

function productSvg(name, accent) {
  const label = name === "placeholder" ? "ADDITIVE" : name.toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${label} — visuel temporaire">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="80%">
      <stop offset="0%" stop-color="#1d1d1d"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  ${grid(accent)}
  ${lattice(accent, 600, 430, 330)}
  ${glasses(accent)}
  <text x="600" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" letter-spacing="14" fill="#f4f1ea">${label}</text>
  <text x="600" y="745" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="6" fill="#9c968c">NYLON PA12 — IMPRESSION 3D SLS</text>
</svg>`;
}

function collectionSvg(name, accent, sub) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="Collection ${name}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#161616"/>
      <stop offset="100%" stop-color="#070707"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#bg)"/>
  ${grid(accent)}
  ${lattice(accent, 1150, 420, 420, 18)}
  <circle cx="1150" cy="420" r="180" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="2"/>
  <circle cx="1150" cy="420" r="260" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="1.5"/>
  <text x="110" y="470" font-family="Arial, sans-serif" font-size="110" font-weight="700" letter-spacing="6" fill="#f4f1ea">${name}</text>
  <text x="114" y="530" font-family="Arial, sans-serif" font-size="26" letter-spacing="5" fill="${accent}">${sub}</text>
</svg>`;
}

for (const [slug, col] of PRODUCTS) {
  writeFileSync(join(PRODUCTS_DIR, `${slug}.svg`), productSvg(slug, ACCENTS[col]));
}
writeFileSync(join(COLLECTIONS_DIR, "modulair.svg"), collectionSvg("MODUL’AIR", ACCENTS.modulair, "SYSTÈME MODULAIRE"));
writeFileSync(join(COLLECTIONS_DIR, "generative.svg"), collectionSvg("GENERATIVE", ACCENTS.generative, "DESIGN GÉNÉRATIF"));
writeFileSync(join(COLLECTIONS_DIR, "hybride.svg"), collectionSvg("HYBRIDE", ACCENTS.hybride, "ARTISANAT NUMÉRIQUE"));

console.log("✓ Visuels SVG générés dans public/images/");
