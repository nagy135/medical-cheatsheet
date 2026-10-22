import { describe, it, expect } from 'vitest';
import { evaluateCalculator } from '../calculators';
import { calciumCalculator, calciumPose, calciumRaw, calciumExample } from './calcium-model';
describe('Calcium compound slide', () => {
  it('matches independent values and separates both controls', () => {
    const b = calciumPose(calciumExample)!,
      ca = calciumPose({ calcium: 2.5, albumin: 30 })!,
      alb = calciumPose({ calcium: 2.1, albumin: 20 })!;
    expect(b.result).toBeCloseTo(2.3, 12);
    expect(b.correction).toBeCloseTo(0.2, 12);
    expect(ca.result).toBeCloseTo(2.7, 12);
    expect(ca.offset).toBe(b.offset);
    expect(ca.measuredX).toBeGreaterThan(b.measuredX);
    expect(alb.result).toBeCloseTo(2.5, 12);
    expect(alb.measuredX).toBe(b.measuredX);
    expect(alb.offset).toBeCloseTo(2 * b.offset, 12);
  });
  it.each([
    [40, 0, 2.1],
    [50, -0.2, 1.9],
    [100, -1.2, 0.9],
    [20, 0.4, 2.5],
  ])('keeps correction signed at albumin %s', (albumin, delta, result) => {
    const p = calciumPose({ calcium: 2.1, albumin })!;
    expect(p.correction).toBeCloseTo(delta, 12);
    expect(p.result).toBeCloseTo(result, 12);
    expect((p.resultX - p.measuredX) / p.unit).toBeCloseTo(delta, 12);
  });
  it.each([0, 1])('converts albumin unit %s without changing geometry', (index) => {
    const units = { albumin: index },
      e = evaluateCalculator(
        calciumCalculator,
        { calcium: '2,1', albumin: calciumRaw('albumin', 30, units) },
        units,
      );
    expect(e.result).toBeCloseTo(2.3, 12);
    expect(calciumPose(e.values)!.offset).toBeCloseTo(7.2, 12);
  });
  it('preserves zero and negative outputs', () => {
    expect(calciumPose({ calcium: 1.2, albumin: 100 })!.result).toBeCloseTo(0, 12);
    expect(calciumPose({ calcium: 0.1, albumin: 100 })!.result).toBeCloseTo(-1.1, 12);
  });
  it.each([0.000001, 2.1, 1e6])(
    'uses the same scale for both coordinates at calcium %s',
    (calcium) => {
      const p = calciumPose({ calcium, albumin: 100 })!;
      expect((p.measuredX + 70) / p.unit).toBeCloseTo(calcium, 8);
      expect((p.resultX + 70) / p.unit).toBeCloseTo(p.result, 8);
      expect(p.measuredX).toBeLessThanOrEqual(50);
      expect(p.resultX).toBeGreaterThan(-114);
    },
  );
  it('rejects invalid inputs', () => {
    for (const v of [
      { calcium: 0, albumin: 30 },
      { calcium: 2, albumin: 101 },
      { calcium: NaN, albumin: 30 },
    ])
      expect(calciumPose(v)).toBeNull();
  });
});
