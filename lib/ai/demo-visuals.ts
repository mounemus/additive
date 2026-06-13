/**
 * Visuels de repli "mode démo" — assumés comme croquis d'intention.
 * Utilisés UNIQUEMENT quand aucun fournisseur d'IA n'est configuré.
 * Génèrent des images SVG (data URL) cohérentes avec la palette du profil,
 * pour que moodboard et concepts restent visuels même sans clé IA.
 */

function svgToDataUrl(svg: string): string {
  // encodeURIComponent garde les SVG lisibles et compatibles next/image.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Planche moodboard : grille de vignettes (matières, palette, lattice). */
export function demoMoodboardSvg(colors: string[], material: string, seed = 7): string {
  const rnd = seeded(seed);
  const [bg, mid, dark] = colors.length >= 3 ? colors : ["#f3f1ec", "#d8d8d4", "#111111"];
  const cells: string[] = [];
  const cols = 4;
  const rows = 3;
  const w = 1200;
  const h = 900;
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * ch;
      const kind = Math.floor(rnd() * 4);
      const fill = [bg, mid, dark, mid][kind];
      let inner = "";
      if (kind === 0) {
        // lattice
        let lines = "";
        for (let i = 0; i < 7; i++) {
          const lx = x + (i / 6) * cw;
          lines += `<line x1="${lx}" y1="${y}" x2="${x + ((6 - i) / 6) * cw}" y2="${y + ch}" stroke="${dark}" stroke-opacity="0.18" stroke-width="1.5"/>`;
        }
        inner = lines;
      } else if (kind === 1) {
        inner = `<circle cx="${x + cw / 2}" cy="${y + ch / 2}" r="${Math.min(cw, ch) * 0.3}" fill="none" stroke="${dark}" stroke-opacity="0.4" stroke-width="2"/>`;
      } else if (kind === 2) {
        inner = `<rect x="${x + cw * 0.25}" y="${y + ch * 0.3}" width="${cw * 0.5}" height="${ch * 0.4}" rx="${ch * 0.2}" fill="none" stroke="${bg}" stroke-opacity="0.5" stroke-width="3"/>`;
      } else {
        const sw = rnd() * 30 + 10;
        inner = `<rect x="${x + 12}" y="${y + ch - 28}" width="${sw}" height="10" rx="5" fill="${bg}" fill-opacity="0.6"/>`;
      }
      cells.push(
        `<g><rect x="${x}" y="${y}" width="${cw - 3}" height="${ch - 3}" fill="${fill}"/>${inner}</g>`
      );
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${dark}"/>
    ${cells.join("")}
    <text x="24" y="${h - 22}" font-family="Arial" font-size="20" letter-spacing="5" fill="${bg}" fill-opacity="0.7">MOODBOARD — ${material.toUpperCase()}</text>
  </svg>`;
  return svgToDataUrl(svg);
}

/** Rendu concept de démo : silhouette de monture sur fond studio. */
export function demoConceptSvg(label: string, colors: string[], seed = 3): string {
  const [bg, mid, dark] = colors.length >= 3 ? colors : ["#f3f1ec", "#d8d8d4", "#111111"];
  const accent = mid;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 750">
    <defs><radialGradient id="g" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="${dark}"/><stop offset="100%" stop-color="#0a0a0a"/>
    </radialGradient></defs>
    <rect width="1000" height="750" fill="url(#g)"/>
    <g transform="translate(500 360)">
      <g fill="none" stroke="${accent}" stroke-width="11" stroke-linecap="round">
        <rect x="-235" y="-65" width="200" height="135" rx="52"/>
        <rect x="35" y="-65" width="200" height="135" rx="52"/>
        <path d="M -35 -28 C -16 -50, 16 -50, 35 -28"/>
        <path d="M -235 -18 L -315 -42"/>
        <path d="M 235 -18 L 315 -42"/>
      </g>
      <g fill="${accent}" fill-opacity="0.1">
        <rect x="-235" y="-65" width="200" height="135" rx="52"/>
        <rect x="35" y="-65" width="200" height="135" rx="52"/>
      </g>
    </g>
    <text x="500" y="640" text-anchor="middle" font-family="Arial" font-size="40" font-weight="700" letter-spacing="6" fill="${bg}">${label.toUpperCase()}</text>
    <text x="500" y="678" text-anchor="middle" font-family="Arial" font-size="16" letter-spacing="4" fill="${mid}">CONCEPT — RENDU D'INTENTION</text>
  </svg>`;
  return svgToDataUrl(svg);
}

/** Vignette d'essayage de démo (overlay monture sur silhouette neutre). */
export function demoFrameOverlaySvg(colors: string[]): string {
  const accent = colors[1] ?? "#1f6fff";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 240">
    <g fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round">
      <rect x="40" y="60" width="200" height="130" rx="50"/>
      <rect x="360" y="60" width="200" height="130" rx="50"/>
      <path d="M 240 95 C 270 70, 330 70, 360 95"/>
    </g>
  </svg>`;
  return svgToDataUrl(svg);
}
