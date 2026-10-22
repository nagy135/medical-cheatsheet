import { describe, it, expect } from 'vitest';
import { waterPose, waterExample } from './water-model';
describe('Water deficit dilution chamber', () => {
  it('maps the reference example to proportional real volumes', () => {
    const p = waterPose(waterExample)!;
    expect(p.tbw).toBe(42);
    expect(p.result).toBeCloseTo(9, 12);
    expect(p.total).toBe(51);
    expect(p.currentLength).toBeCloseTo(151.2, 12);
    expect(p.extraLength).toBeCloseTo(32.4, 12);
  });
  it.each([
    [{ weight: 80, sodium: 170, bodyWaterFraction: 0.6 }, 48, 10.285714285714286],
    [{ weight: 70, sodium: 180, bodyWaterFraction: 0.6 }, 42, 12],
    [{ weight: 70, sodium: 170, bodyWaterFraction: 0.5 }, 35, 7.5],
  ])('responds to each independent input %j', (v, tbw, result) => {
    const p = waterPose(v)!;
    expect(p.tbw).toBeCloseTo(tbw, 12);
    expect(p.result).toBeCloseTo(result, 12);
    expect(p.extraLength / p.currentLength).toBeCloseTo(v.sodium / 140 - 1, 12);
  });
  it('has no artificial extension at sodium 140', () => {
    const p = waterPose({ ...waterExample, sodium: 140 })!;
    expect(p.result).toBe(0);
    expect(p.extraLength).toBe(0);
    expect(p.totalLength).toBe(p.currentLength);
  });
  it('preserves the drawing for equal estimated body water', () => {
    const equivalent = waterPose({ weight: 84, sodium: 170, bodyWaterFraction: 0.5 })!,
      base = waterPose(waterExample)!;
    expect(equivalent.tbw).toBe(base.tbw);
    expect(equivalent.currentLength).toBe(base.currentLength);
    expect(equivalent.extraLength).toBe(base.extraLength);
  });
  it.each([
    { ...waterExample, sodium: 1e6 },
    { weight: 500, sodium: 170, bodyWaterFraction: 1 },
    { weight: 0.000001, sodium: 140, bodyWaterFraction: 0.000001 },
  ])('uses a shared bounded scale and dilution identity at %j', (v) => {
    const p = waterPose(v)!;
    expect(p.totalLength).toBeLessThanOrEqual(240);
    expect(p.currentLength + p.extraLength).toBeCloseTo(p.totalLength, 10);
    expect(p.tbw * v.sodium).toBeCloseTo(p.total * 140, 6);
    expect(p.extraLength / p.unit).toBeCloseTo(p.result, 8);
  });
  it('rejects invalid input', () => {
    for (const v of [
      { ...waterExample, weight: 0 },
      { ...waterExample, sodium: 139 },
      { ...waterExample, bodyWaterFraction: 1.1 },
    ])
      expect(waterPose(v)).toBeNull();
  });
});
