import { getScoreColor } from '../lib/display';

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const color = getScoreColor(score);
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;

  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="-rotate-90 absolute">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3.5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3.5}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="text-sm font-bold relative z-10" style={{ color, fontFamily: "'Space Mono', monospace" }}>
        {score}
      </span>
    </div>
  );
}
