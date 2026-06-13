import { colorOf, VERRE_TINT, type ModulairSelection } from "@/lib/modulair";

/**
 * Aperçu vectoriel composé en direct de la combinaison MODUL'AIR
 * (forme de face, couleurs face/branches, teinte de verres, indice de finition).
 * Instantané — sert de retour visuel avant/à la place du rendu IA.
 */
export function ModulairPreview({
  selection,
  className,
}: {
  selection: ModulairSelection;
  className?: string;
}) {
  const face = colorOf(selection.faceColor).hex;
  const branch = colorOf(selection.branchColor).hex;
  const tint = VERRE_TINT[selection.verre as keyof typeof VERRE_TINT] ?? "rgba(180,200,220,0.18)";
  const stroke = selection.faceShape === "sculpturale" ? 16 : selection.faceShape === "ovale" ? 9 : 11;
  const branchW = selection.branchStyle === "minimaliste" ? 5 : selection.branchStyle === "expressive" ? 12 : 8;
  const dash =
    selection.finish === "lattice" ? "2 5" : selection.finish === "microstructure" ? "1 3" : undefined;

  return (
    <svg viewBox="0 0 460 220" className={className} role="img" aria-label="Aperçu de la monture modulaire">
      <defs>
        <linearGradient id="bg-mod" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#161616" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect width="460" height="220" rx="16" fill="url(#bg-mod)" />

      {/* Branches (derrière la face) */}
      <line x1="70" y1="96" x2="14" y2="78" stroke={branch} strokeWidth={branchW} strokeLinecap="round" />
      <line x1="390" y1="96" x2="446" y2="78" stroke={branch} strokeWidth={branchW} strokeLinecap="round" />

      {/* Verres */}
      <Lens cx={140} shape={selection.faceShape} fill={tint} stroke={face} sw={stroke} dash={dash} />
      <Lens cx={320} shape={selection.faceShape} fill={tint} stroke={face} sw={stroke} dash={dash} />

      {/* Pont nasal */}
      <path d="M 198 96 C 215 80, 245 80, 262 96" fill="none" stroke={face} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}

function Lens({
  cx,
  shape,
  fill,
  stroke,
  sw,
  dash,
}: {
  cx: number;
  shape: string;
  fill: string;
  stroke: string;
  sw: number;
  dash?: string;
}) {
  const cy = 104;
  const common = { fill, stroke, strokeWidth: sw, strokeDasharray: dash };
  switch (shape) {
    case "ronde":
      return <ellipse cx={cx} cy={cy} rx={58} ry={54} {...common} />;
    case "ovale":
      return <ellipse cx={cx} cy={cy} rx={62} ry={44} {...common} />;
    case "carree":
      return <rect x={cx - 58} y={cy - 46} width={116} height={92} rx={14} {...common} />;
    case "rectangulaire":
      return <rect x={cx - 64} y={cy - 38} width={128} height={76} rx={10} {...common} />;
    case "geometrique":
      return (
        <polygon
          points={hexPoints(cx, cy, 62, 50)}
          {...common}
          strokeLinejoin="round"
        />
      );
    case "papillon":
      return (
        <path d={catEye(cx, cy)} {...common} strokeLinejoin="round" />
      );
    case "organique":
      return <rect x={cx - 60} y={cy - 46} width={120} height={92} rx={42} {...common} />;
    case "sculpturale":
      return <rect x={cx - 60} y={cy - 50} width={120} height={100} rx={28} {...common} />;
    default:
      return <ellipse cx={cx} cy={cy} rx={58} ry={50} {...common} />;
  }
}

function hexPoints(cx: number, cy: number, rx: number, ry: number): string {
  const pts = [
    [cx - rx, cy - ry * 0.4],
    [cx - rx * 0.5, cy - ry],
    [cx + rx * 0.5, cy - ry],
    [cx + rx, cy - ry * 0.4],
    [cx + rx * 0.6, cy + ry],
    [cx - rx * 0.6, cy + ry],
  ];
  return pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
}

function catEye(cx: number, cy: number): string {
  const w = 62;
  const h = 46;
  return [
    `M ${cx - w} ${cy - h * 0.2}`,
    `C ${cx - w} ${cy - h * 1.1}, ${cx - w * 0.2} ${cy - h}, ${cx + w * 0.2} ${cy - h}`,
    `C ${cx + w} ${cy - h}, ${cx + w} ${cy - h * 0.4}, ${cx + w} ${cy - h * 0.2}`,
    `C ${cx + w} ${cy + h}, ${cx - w * 0.6} ${cy + h}, ${cx - w} ${cy - h * 0.2}`,
    "Z",
  ].join(" ");
}
