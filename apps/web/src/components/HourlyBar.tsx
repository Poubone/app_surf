import { getScoreColor } from '../lib/display';

export function HourlyBar({
  h,
  maxH,
  selected,
  onSelect,
}: {
  h: { hour: string; score: number; height: number };
  maxH: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const color = getScoreColor(h.score);
  const pct = maxH > 0 ? (h.height / maxH) * 100 : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-2 flex-1 rounded-lg py-1 transition-all"
      style={{
        backgroundColor: selected ? `${color}12` : 'transparent',
        border: selected ? `1px solid ${color}` : '1px solid transparent',
        cursor: onSelect ? 'pointer' : 'default',
      }}
    >
      <span className="text-xs font-bold" style={{ color, fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}>
        {h.score}
      </span>
      <div
        className="w-full flex flex-col justify-end rounded-md overflow-hidden"
        style={{ height: 52, backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        <div
          className="w-full rounded-t-md transition-all duration-300"
          style={{ height: `${pct}%`, backgroundColor: color, opacity: selected ? 1 : 0.8 }}
        />
      </div>
      <span
        className={selected ? 'text-foreground font-bold' : 'text-muted-foreground'}
        style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem' }}
      >
        {h.hour}
      </span>
    </button>
  );
}
