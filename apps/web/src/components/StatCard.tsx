import type { ReactNode } from 'react';

export function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 p-4 rounded-2xl"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: color || '#5a7294' }}>{icon}</span>
        <span
          className="text-xs uppercase tracking-widest text-muted-foreground"
          style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem' }}
        >
          {label}
        </span>
      </div>
      <div>
        <div className="text-xl font-bold text-foreground" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
          {value}
        </div>
        {sub && (
          <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
