import { describe, it, expect } from 'vitest';
import { defaultDetailHour, displayHourForNow } from './days';

describe('displayHourForNow', () => {
  it('picks 12h between 12h and 14h', () => {
    expect(displayHourForNow(new Date(2026, 6, 10, 13, 30))).toBe(12);
  });

  it('picks 14h from 14h onward until 16h', () => {
    expect(displayHourForNow(new Date(2026, 6, 10, 14, 0))).toBe(14);
    expect(displayHourForNow(new Date(2026, 6, 10, 15, 45))).toBe(14);
  });

  it('defaults future days to first display slot (6h)', () => {
    expect(defaultDetailHour(1)).toBe(6);
    expect(defaultDetailHour(0, new Date(2026, 6, 10, 13, 30))).toBe(12);
  });
});
