import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

/**
 * « Impression couche par couche » : une monture de lunettes se construit de bas
 * en haut, révélée par une ligne de balayage bleue (esprit SLS), sur fond ink.
 * Fondu aux extrémités pour une boucle propre.
 */
export const PrintLayers: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const build = interpolate(frame, [12, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scanY = height * (1 - build);
  const edge = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const cx = width / 2;
  const cy = height / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0d10" }}>
      <AbsoluteFill style={{ opacity: edge }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <clipPath id="reveal">
              <rect x={0} y={scanY} width={width} height={height} />
            </clipPath>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
            <radialGradient id="vig" cx="50%" cy="48%" r="70%">
              <stop offset="0%" stopColor="#11151b" />
              <stop offset="100%" stopColor="#0b0d10" />
            </radialGradient>
          </defs>

          <rect width={width} height={height} fill="url(#vig)" />

          {/* Lattice de fond discret */}
          {Array.from({ length: 26 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={(i * width) / 26}
              y1={0}
              x2={(i * width) / 26}
              y2={height}
              stroke="#1f6fff"
              strokeOpacity={0.05}
              strokeWidth={1}
            />
          ))}

          {/* Contour fantôme (non imprimé) */}
          <Glasses cx={cx} cy={cy} stroke="#222831" sw={16} />

          {/* Partie imprimée (révélée sous la ligne de balayage) */}
          <g clipPath="url(#reveal)">
            <Glasses cx={cx} cy={cy} stroke="#f3f2ed" sw={16} />
          </g>

          {/* Ligne de balayage SLS */}
          {build > 0.001 && build < 0.999 && (
            <g>
              <rect x={0} y={scanY - 3} width={width} height={6} fill="#1f6fff" filter="url(#glow)" />
              <rect x={0} y={scanY - 1} width={width} height={2} fill="#bcd4ff" />
            </g>
          )}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Glasses: React.FC<{ cx: number; cy: number; stroke: string; sw: number }> = ({ cx, cy, stroke, sw }) => {
  const lw = 320;
  const lh = 240;
  const gap = 140;
  const lx = cx - gap / 2 - lw;
  const rx = cx + gap / 2;
  const ty = cy - lh / 2;
  return (
    <g fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <rect x={lx} y={ty} width={lw} height={lh} rx={90} />
      <rect x={rx} y={ty} width={lw} height={lh} rx={90} />
      <path d={`M ${lx + lw} ${cy - 30} C ${cx - 40} ${cy - 70}, ${cx + 40} ${cy - 70}, ${rx} ${cy - 30}`} />
      <path d={`M ${lx} ${cy - 20} L ${lx - 150} ${cy - 55}`} />
      <path d={`M ${rx + lw} ${cy - 20} L ${rx + lw + 150} ${cy - 55}`} />
    </g>
  );
};
