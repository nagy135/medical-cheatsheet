import { describe, it, expect } from 'vitest';
import { bazettExample, bazettPose } from './bazett-model';
describe('Bazett circular slide rule', () => {
  it('matches independently calculated references and both inputs', () => {
    expect(bazettPose(bazettExample)!.result).toBeCloseTo(447.21359549995793, 10);
    expect(bazettPose({ qt: 500, heartRate: 75 })!.result).toBeCloseTo(559.0169943749474, 10);
    expect(bazettPose({ qt: 400, heartRate: 120 })!.result).toBeCloseTo(565.685424949238, 10);
    expect(bazettPose({ qt: 400, heartRate: 30 })!.result).toBeCloseTo(282.842712474619, 10);
  });
  it('keeps QT unchanged at 60/min and scales linearly with QT', () => {
    for (const qt of [200, 400, 600]) {
      const p = bazettPose({ qt, heartRate: 60 })!;
      expect(p.result).toBe(qt);
      expect(p.gainAngle).toBe(0);
      expect(p.resultAngle).toBe(p.qtAngle);
    }
    expect(
      bazettPose({ qt: 800, heartRate: 75 })!.result / bazettPose(bazettExample)!.result,
    ).toBeCloseTo(2, 12);
  });
  it('doubling heart rate multiplies QTc by sqrt(2), leaving the QT pointer fixed in the ordinary scale', () => {
    const a = bazettPose({ qt: 400, heartRate: 60 })!,
      b = bazettPose({ qt: 400, heartRate: 120 })!;
    expect(b.qtAngle).toBe(a.qtAngle);
    expect(b.result / a.result).toBeCloseTo(Math.SQRT2, 12);
    expect(b.gainAngle).toBeGreaterThan(a.gainAngle);
  });
  it.each([
    [400, 75],
    [1500, 350],
    [0.000001, 0.000001],
    [1500, 0.000001],
    [0.000001, 350],
  ])('uses true log multiplication without wrapping at QT %s and rate %s', (qt, heartRate) => {
    const p = bazettPose({ qt, heartRate })!;
    expect(p.resultAngle).toBeCloseTo(p.qtAngle + p.gainAngle, 12);
    expect(400 * Math.exp(p.resultAngle / p.k)).toBeCloseTo(p.result, 8);
    for (const angle of [p.qtAngle, p.resultAngle, p.gainAngle])
      expect(Math.abs(angle)).toBeLessThanOrEqual((105 * Math.PI) / 180 + 1e-12);
  });
  it('rejects invalid values and registry limits', () => {
    for (const values of [
      { qt: 0, heartRate: 75 },
      { qt: 400, heartRate: 0 },
      { qt: 1501, heartRate: 75 },
      { qt: 400, heartRate: 351 },
      { qt: NaN, heartRate: 75 },
    ])
      expect(bazettPose(values)).toBeNull();
  });
});
