export function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export function isInAngleWindow(angle: number, min: number, max: number): boolean {
  const n = ((angle % 360) + 360) % 360;
  const a = ((min % 360) + 360) % 360;
  const b = ((max % 360) + 360) % 360;
  if (a <= b) return n >= a && n <= b;
  return n >= a || n <= b;
}

export function distanceOutsideWindow(angle: number, min: number, max: number): number {
  if (isInAngleWindow(angle, min, max)) return 0;
  const n = ((angle % 360) + 360) % 360;
  const a = ((min % 360) + 360) % 360;
  const b = ((max % 360) + 360) % 360;
  const distToA = angleDiff(n, a);
  const distToB = angleDiff(n, b);
  return Math.min(distToA, distToB);
}
