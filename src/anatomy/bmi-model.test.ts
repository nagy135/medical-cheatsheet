import { describe, it, expect } from 'vitest';
import { bmiCalculator, bmiEvaluation, bmiExample, bmiPose } from './bmi-model';
import { bmiBounds } from './bmi-solid';
describe('BMI square load platen', () => {
  it('uses the registry formula and true square area', () => {
    const p = bmiPose(bmiExample)!;
    expect(p.result).toBe(bmiCalculator.calculate(bmiExample));
    expect(p.area).toBe(3.0625);
    expect(p.side).toBe(87.5);
    expect(p.thickness / p.verticalScale).toBe(p.result);
  });
  it('weight changes volume and thickness without changing the square', () => {
    const a = bmiPose(bmiExample)!,
      b = bmiPose({ ...bmiExample, weight: 150 })!;
    expect(b.side).toBe(a.side);
    expect(b.volume).toBeCloseTo(a.volume * 2, 9);
    expect(b.thickness).toBeCloseTo(a.thickness * 2, 9);
  });
  it('doubling height quadruples area and quarters thickness at fixed mass', () => {
    const a = bmiPose({ weight: 75, height: 100 })!,
      b = bmiPose({ weight: 75, height: 200 })!;
    // Compare physical units because the high result expands the vertical display scale.
    expect(b.side ** 2).toBe(a.side ** 2 * 4);
    expect(b.thickness / b.verticalScale).toBe(a.thickness / a.verticalScale / 4);
    expect(b.volume / b.verticalScale).toBeCloseTo(a.volume / a.verticalScale, 9);
  });
  it.each([
    { weight: 500, height: 100 },
    { weight: 500, height: 250 },
    { weight: 0.000001, height: 250 },
  ])('preserves exact division at %j', (v) => {
    const p = bmiPose(v)!;
    expect(p.thickness).toBeLessThanOrEqual(70);
    expect(p.volume / (2500 * p.verticalScale)).toBeCloseTo(v.weight, 9);
    expect(bmiBounds(p).load[5] / p.verticalScale).toBeCloseTo(p.result, 10);
  });
  it('keeps equal BMI thickness while preserving different mass and area', () => {
    const a = bmiPose({ weight: 25, height: 100 })!,
      b = bmiPose({ weight: 100, height: 200 })!;
    expect(a.result).toBe(b.result);
    expect(a.thickness).toBe(b.thickness);
    expect(b.volume).toBe(a.volume * 4);
  });
  it('evaluates display raw values and unit indices through the registry', () => {
    const p = bmiEvaluation({ weight: '75,5', height: '175' }, {}).pose!;
    expect(p.weight).toBe(75.5);
    // BMI currently has no switches. Unit indices must not invent a conversion.
    expect(bmiEvaluation({ weight: '75,5', height: '175' }, { weight: 1, height: 1 }).pose).toEqual(
      p,
    );
    expect(bmiCalculator.fields.every((f) => !f.units && !f.options)).toBe(true);
  });
  it.each([
    { weight: '', height: '175' },
    { weight: '75', height: '' },
    { weight: 'x', height: '175' },
    { weight: '0', height: '175' },
    { weight: '501', height: '175' },
    { weight: '75', height: '99' },
    { weight: '75', height: '251' },
  ])('hides incomplete or invalid state %j', (raw) =>
    expect(bmiEvaluation(raw, {}).pose).toBeNull(),
  );
  it('rejects non-finite canonical values', () =>
    expect(bmiPose({ weight: NaN, height: 175 })).toBeNull());
});
