import { describe, it, expect } from 'vitest';
import { angleDiff, isInAngleWindow, distanceOutsideWindow } from './angles';

describe('angleDiff', () => {
  it('returns shortest arc between two bearings', () => {
    expect(angleDiff(350, 10)).toBe(20);
    expect(angleDiff(10, 350)).toBe(20);
    expect(angleDiff(150, 310)).toBe(160);
  });
});

describe('isInAngleWindow', () => {
  it('handles windows that do not cross 0', () => {
    expect(isInAngleWindow(300, 290, 320)).toBe(true);
    expect(isInAngleWindow(270, 290, 320)).toBe(false);
  });
});

describe('distanceOutsideWindow', () => {
  it('returns 0 when inside window', () => {
    expect(distanceOutsideWindow(300, 290, 320)).toBe(0);
  });
  it('returns degrees when outside', () => {
    expect(distanceOutsideWindow(270, 290, 320)).toBe(20);
  });
});
