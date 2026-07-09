export function scoreColor(score: number | null): string {
  if (score === null) return '#9CA3AF';
  if (score >= 60) return '#22C55E';
  if (score >= 30) return '#F97316';
  return '#EF4444';
}
