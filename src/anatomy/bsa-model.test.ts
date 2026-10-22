import { describe, it, expect } from 'vitest';
import { bsaExample, bsaPose } from './bsa-model';

describe('Mosteller aperture instrument', () => {
  it('matches the independent Mosteller reference and both inputs influence the area', () => {
    const baseline = bsaPose(bsaExample)!;
    expect(baseline.result).toBeCloseTo(1.9094065395649333, 12);
    expect(bsaPose({ height: 200, weight: 75 })!.result).toBeCloseTo(2.041241452319315, 12);
    expect(bsaPose({ height: 175, weight: 100 })!.result).toBeCloseTo(2.204792759220492, 12);
    expect(bsaPose({ height: 200, weight: 75 })!.area).toBeGreaterThan(baseline.area);
    expect(bsaPose({ height: 175, weight: 100 })!.area).toBeGreaterThan(baseline.area);
  });
  it.each([0, 0.1, 0.25, 0.5, 0.75, 1])(
    'preserves area and the medical result at form %s',
    (form) => {
      const pose = bsaPose(bsaExample, form)!;
      expect(pose.width * pose.depth).toBeCloseTo((175 * 75) / 3600, 12);
      expect(pose.w * pose.h).toBeCloseTo(((175 * 75) / 3600) * 52 ** 2, 9);
      expect(pose.result).toBeCloseTo(1.9094065395649333, 12);
    },
  );
  it('ends in a square whose side is the numeric BSA', () => {
    const pose = bsaPose(bsaExample, 1)!;
    expect(pose.width).toBeCloseTo(pose.depth, 12);
    expect(pose.width).toBeCloseTo(pose.result, 12);
  });
  it.each([
    [100, 0.000001],
    [250, 500],
    [200, 100],
  ])('fits the mechanical frame at %s cm and %s kg', (height, weight) => {
    for (const form of [0, 0.5, 1]) {
      const pose = bsaPose({ height, weight }, form)!;
      expect(pose.w).toBeGreaterThan(0);
      expect(pose.h).toBeGreaterThan(0);
      expect(pose.w).toBeLessThanOrEqual(180.000001);
      expect(pose.h).toBeLessThanOrEqual(180.000001);
      expect(pose.width * pose.depth).toBeCloseTo((height * weight) / 3600, 10);
    }
  });
  it('rejects empty, negative and out-of-range values rather than showing an old result', () => {
    for (const v of [
      { height: 175, weight: 0 },
      { height: 99, weight: 75 },
      { height: 251, weight: 75 },
      { height: 175, weight: 501 },
      { height: NaN, weight: 75 },
    ])
      expect(bsaPose(v)).toBeNull();
  });
});
