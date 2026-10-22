import { describe, it, expect } from 'vitest';
import { shockExample, shockPose } from './shock-model';
describe('shock-index balance', () => {
  it('matches independent quotients and opposite input sensitivities', () => {
    const base = shockPose(shockExample)!;
    expect(base.result).toBe(0.75);
    const heart = shockPose({ heartRate: 120, systolic: 120 })!;
    const pressure = shockPose({ heartRate: 90, systolic: 90 })!;
    expect(heart.result).toBe(1);
    expect(pressure.result).toBe(1);
    expect(heart.pivot).toBeLessThan(base.pivot);
    expect(pressure.pivot).toBeLessThan(base.pivot);
    expect(shockPose({ heartRate: 90, systolic: 150 })!.result).toBe(0.6);
    expect(shockPose({ heartRate: 90, systolic: 150 })!.pivot).toBeGreaterThan(base.pivot);
  });
  it.each([
    [90, 120],
    [120, 90],
    [1, 1000000],
    [1000000, 1],
    [0.000001, 0.000001],
    [180, 240],
  ])('balances moments for %s/%s', (heartRate, systolic) => {
    const p = shockPose({ heartRate, systolic })!;
    expect(p.rightArm / p.leftArm).toBeCloseTo(heartRate / systolic, 8);
    expect(heartRate * p.leftArm).toBeCloseTo(systolic * p.rightArm, 8);
    expect(p.leftArm + p.rightArm).toBeCloseTo(200, 10);
    expect(Math.abs(p.pivot)).toBeLessThanOrEqual(100);
    expect(Math.max(...p.heights)).toBeLessThanOrEqual(48);
  });
  it('preserves the quotient and support position when both inputs double', () => {
    const a = shockPose(shockExample)!,
      b = shockPose({ heartRate: 180, systolic: 240 })!;
    expect(b.result).toBe(a.result);
    expect(b.pivot).toBeCloseTo(a.pivot, 12);
    expect(b.heights[0] / b.heights[1]).toBeCloseTo(a.heights[0] / a.heights[1], 12);
  });
  it('clears invalid inputs', () => {
    for (const values of [
      { heartRate: 0, systolic: 120 },
      { heartRate: 90, systolic: 0 },
      { heartRate: -1, systolic: 120 },
      { heartRate: NaN, systolic: 120 },
      { heartRate: 90, systolic: Infinity },
    ])
      expect(shockPose(values)).toBeNull();
  });
});
