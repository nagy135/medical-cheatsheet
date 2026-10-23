import { describe, expect, it } from 'vitest';
import { evaluateCalculator } from '../calculators';
import { sodiumCalculator, sodiumExample, sodiumPose, sodiumState } from './sodium-model';
describe('Katz sodium correction ramp', () => {
  it('adds the correction to the measured datum with a true shared scale', () => {
    const p = sodiumPose(sodiumExample)!;
    expect(p.result).toBe(134.8);
    expect(p.correction).toBeCloseTo(4.8);
    expect(p.datum - 12).toBeCloseTo(130 * p.unit);
    expect(p.travel * p.slope).toBeCloseTo(p.correction * p.unit);
    expect(p.datum + p.rise - 12).toBeCloseTo(p.result * p.unit);
  });
  it('isolates each original parameter', () => {
    const a = sodiumPose(sodiumExample)!,
      na = sodiumPose({ sodium: 140, glucose: 400 })!,
      g = sodiumPose({ sodium: 130, glucose: 800 })!;
    expect(na.result - a.result).toBeCloseTo(10);
    expect(na.correction).toBe(a.correction);
    expect(g.result - a.result).toBeCloseTo(6.4);
    expect(g.excess).toBe(700);
    expect(g.travel).toBeGreaterThan(a.travel);
  });
  it('uses both display units before evaluating and drawing', () => {
    const mg = sodiumState({ sodium: '130', glucose: '400' }, {}),
      si = sodiumState(
        { sodium: '130', glucose: String(400 / 18.0182).replace('.', ',') },
        { glucose: 1 },
      );
    expect(si.result).toBeCloseTo(mg.result!);
    expect(si.pose!.rise).toBeCloseTo(mg.pose!.rise);
    const v = sodiumState({ sodium: '130', glucose: '20' }, { glucose: 1 });
    expect(v.pose!.glucose).toBeCloseTo(360.364);
    expect(v.result).toBeCloseTo(134.165824);
  });
  it('retains registry validity, including the exact converted lower bound', () => {
    for (const raw of [
      { sodium: '', glucose: '400' },
      { sodium: '130', glucose: '' },
      { sodium: '0', glucose: '400' },
      { sodium: '130', glucose: '99.999' },
      { sodium: 'NaN', glucose: '400' },
      { sodium: '130', glucose: 'abc' },
    ])
      expect(sodiumState(raw, {}).pose).toBeNull();
    expect(sodiumState({ sodium: '130', glucose: '5.54' }, { glucose: 1 }).pose).toBeNull();
    expect(sodiumState({ sodium: '130', glucose: '5.55' }, { glucose: 1 }).pose).not.toBeNull();
    expect(
      sodiumState({ sodium: '130', glucose: String(100 / 18.0182) }, { glucose: 1 }).pose!
        .correction,
    ).toBe(0);
    expect(sodiumPose({ sodium: 130, glucose: 100 })!.rise).toBe(0);
    expect(sodiumPose({ sodium: NaN, glucose: 400 })).toBeNull();
    expect(sodiumPose({ sodium: 130, glucose: 99 })).toBeNull();
  });
  it('preserves ratios at large values without an invented upper clinical limit', () => {
    for (const v of [
      { sodium: 0.000001, glucose: 100 },
      { sodium: 1e6, glucose: 1e6 },
      { sodium: 150, glucose: 1e10 },
      ...Array.from({ length: 100 }, (_, i) => ({ sodium: 80 + i * 2, glucose: 100 + i * 21 })),
    ]) {
      const p = sodiumPose(v)!;
      expect(p.result).toBeCloseTo(
        evaluateCalculator(sodiumCalculator, {
          sodium: String(v.sodium),
          glucose: String(v.glucose),
        }).result!,
        5,
      );
      expect(p.travel * p.slope).toBeCloseTo(p.rise, 8);
      expect((p.datum + p.rise - 12) / p.unit).toBeCloseTo(p.result, 4);
      expect(p.travel).toBeLessThanOrEqual(224);
      expect(p.datum + p.rise).toBeLessThanOrEqual(112);
    }
  });
});
