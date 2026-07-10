import { getScoreColor } from '../lib/display';

export function HourlyBar({ h, maxH }: { h: { hour: string; score: number; height: number }; maxH: number }) {
  const color = getScoreColor(h.score);
  const pct = maxH > 0 ? (h.height / maxH) * 100 : 0;

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <span className="text-xs font-bold" style={{ color, fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
        {h.score}
      </span>
      <div
        className="w-full flex flex-col justify-end rounded-md overflow-hidden"
        style={{ height: 52, backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        <div className="w-full rounded-t-md transition-all duration-500" style={{ height: `${pct}%`, backgroundColor: color, opacity: 0.8 }} />
      </div>
      <span className="text-muted-foreground" style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem' }}>
        {h.hour}
      </span>
    </div>
  );
}
