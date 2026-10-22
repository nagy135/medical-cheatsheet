import { describe, it, expect } from 'vitest';
import { evaluateCalculator } from '../calculators';
import { horovitzCalculator, horovitzExample, horovitzPose, horovitzRaw } from './horovitz-model';
describe('Horovitz normalization bench', () => {
  it('matches independent references and both input sensitivities', () => {
    const base = horovitzPose(horovitzExample)!;
    expect(base.result).toBe(200);
    expect(base.fraction).toBe(0.4);
    expect(base.gain).toBe(2.5);
    const p = horovitzPose({ pao2: 120, fio2: 40 })!,
      f = horovitzPose({ pao2: 80, fio2: 80 })!;
    expect(p.result).toBe(300);
    expect(p.heights[0]).toBeGreaterThan(base.heights[0]);
    expect(p.oxygenWidth).toBe(base.oxygenWidth);
    expect(f.result).toBe(100);
    expect(f.oxygenWidth).toBe(2 * base.oxygenWidth);
    expect(f.heights[0]).toBe(base.heights[0]);
    expect(f.heights[1]).toBe(base.heights[1] / 2);
  });
  it('has identical columns at 100% and preserves the quotient when both inputs double', () => {
    const pure = horovitzPose({ pao2: 80, fio2: 100 })!;
    expect(pure.heights[0]).toBe(pure.heights[1]);
    expect(pure.result).toBe(80);
    expect(pure.oxygenWidth).toBe(96);
    expect(horovitzPose({ pao2: 160, fio2: 80 })!.result).toBe(200);
  });
  it.each([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ])('preserves canonical values for pressure/FiO2 units %s/%s', (pao2, fio2) => {
    const units = { pao2, fio2 },
      raw = { pao2: horovitzRaw('pao2', 80, units), fio2: horovitzRaw('fio2', 40, units) };
    const result = evaluateCalculator(horovitzCalculator, raw, units);
    expect(result.result).toBeCloseTo(200, 8);
    expect(horovitzPose(result.values)!.oxygenWidth).toBeCloseTo(38.4, 10);
  });
  it.each([
    [80, 21],
    [0.000001, 21],
    [1e6, 21],
    [80, 100],
  ])('fits %s mmHg at %s percent on a common pressure scale', (pao2, fio2) => {
    const p = horovitzPose({ pao2, fio2 })!;
    for (const h of p.heights) {
      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThanOrEqual(180.000001);
    }
    expect(p.heights[1] / p.heights[0]).toBeCloseTo(100 / fio2, 10);
  });
  it('rejects values outside the registry range', () => {
    for (const v of [
      { pao2: 0, fio2: 40 },
      { pao2: 80, fio2: 20 },
      { pao2: 80, fio2: 101 },
      { pao2: NaN, fio2: 40 },
    ])
      expect(horovitzPose(v)).toBeNull();
  });
});
