import { describe, it, expect } from 'vitest';
import { anionExample, anionPose } from './anion-model';
describe('anion-gap cabinet', () => {
  it('uses the original formula and each independent input', () => {
    expect(anionPose(anionExample)!.result).toBe(12);
    for (const [field, expected] of [
      ['sodium', 22],
      ['chloride', 2],
      ['bicarbonate', 2],
    ] as const) {
      const p = anionPose({ ...anionExample, [field]: anionExample[field] + 10 })!;
      expect(p.result).toBe(expected);
      expect(p.gapHeight).toBeCloseTo(Math.abs(expected), 10);
    }
  });
  it('preserves a negative result and draws its magnitude', () => {
    const p = anionPose({ ...anionExample, sodium: 120 })!;
    expect(p.result).toBe(-8);
    expect(p.sign).toBe(-1);
    expect(p.gapHeight).toBe(8);
    expect(p.gapStart).toBe(120);
  });
  it('closes the gap exactly at zero without a fake minimum strip', () => {
    const p = anionPose({ ...anionExample, sodium: 128 })!;
    expect(p.result).toBe(0);
    expect(p.gapHeight).toBe(0);
    expect(p.heights[0]).toBeCloseTo(p.totalHeight, 12);
  });
  it('moving the boundary between measured anions preserves their sum', () => {
    const a = anionPose(anionExample)!,
      b = anionPose({ ...anionExample, chloride: 114, bicarbonate: 14 })!;
    expect(b.result).toBe(a.result);
    expect(b.totalHeight).toBeCloseTo(a.totalHeight, 12);
    expect(b.gapHeight).toBe(a.gapHeight);
    expect(b.heights[1]).toBeGreaterThan(a.heights[1]);
  });
  it.each([
    [0.000001, 0.000001, 0.000001],
    [140, 1000000, 1000000],
    [1000000, 1, 1],
    [1.5e308, 1e308, 1e308],
  ])(
    'fits valid values %s/%s/%s without intermediate overflow',
    (sodium, chloride, bicarbonate) => {
      const p = anionPose({ sodium, chloride, bicarbonate })!;
      expect(p).not.toBeNull();
      expect(Number.isFinite(p.result)).toBe(true);
      expect(Math.max(p.heights[0], p.totalHeight)).toBeLessThanOrEqual(180.000001);
      expect(p.heights.every((h) => Number.isFinite(h) && h > 0)).toBe(true);
      expect(Number.isFinite(p.gapHeight)).toBe(true);
    },
  );
  it('rejects invalid values rather than retaining an old gap', () => {
    for (const values of [
      { ...anionExample, sodium: 0 },
      { ...anionExample, chloride: -1 },
      { ...anionExample, bicarbonate: NaN },
      { ...anionExample, sodium: Infinity },
    ])
      expect(anionPose(values)).toBeNull();
  });
});
