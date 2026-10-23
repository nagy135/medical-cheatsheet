import { describe, expect, it } from 'vitest';
import {
  fenaCalculator,
  fenaEvaluation,
  fenaExample,
  fenaInputs,
  fenaPose,
  fenaRaw,
} from './fena-model';

describe('FENa paired sample comparator', () => {
  it('uses the registry formula and shows both concentration ratios', () => {
    const p = fenaPose(fenaExample)!;
    expect(p.result).toBe(fenaCalculator.calculate(fenaExample));
    expect(p.result).toBeCloseTo(1 / 7, 12);
    expect(p.sodiumRatio).toBe(1 / 7);
    expect(p.creatinineRatio).toBe(100);
    expect(p.result).toBeCloseTo((100 * p.sodiumRatio) / p.creatinineRatio, 12);
    expect(p.heights.urineSodium / p.heights.sodium).toBeCloseTo(p.sodiumRatio, 12);
    expect(p.heights.urineCreatinine / p.heights.creatinine).toBeCloseTo(p.creatinineRatio, 12);
  });
  it.each([
    ['sodium', 280, 0.5],
    ['urineSodium', 40, 2],
    ['creatinine', 2, 2],
    ['urineCreatinine', 200, 0.5],
  ] as const)('responds to %s independently in geometry and result', (field, value, factor) => {
    const p = fenaPose({ ...fenaExample, [field]: value })!,
      base = fenaPose(fenaExample)!;
    expect(p.result).toBeCloseTo(base.result * factor, 12);
    expect(p.heights).not.toEqual(base.heights);
  });
  it('allows zero urinary sodium without an artificial column or stale result', () => {
    const p = fenaPose({ ...fenaExample, urineSodium: 0 })!;
    expect(p.result).toBe(0);
    expect(p.sodiumRatio).toBe(0);
    expect(p.heights.urineSodium).toBe(0);
  });
  it.each([
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ])('normalizes serum/urine creatinine units %s/%s', (serum, urine) => {
    const raw = {
      sodium: '140',
      urineSodium: '20',
      creatinine: serum ? '88,4' : '1',
      urineCreatinine: urine ? '8840' : '100',
    };
    const p = fenaEvaluation(raw, { creatinine: serum, urineCreatinine: urine }).pose!;
    expect(p).toEqual(fenaPose(fenaExample));
    expect(fenaRaw('creatinine', 1, { creatinine: serum })).toBe(serum ? '88,4' : '1');
    expect(fenaRaw('urineCreatinine', 100, { urineCreatinine: urine })).toBe(
      urine ? '8840' : '100',
    );
  });
  it('honors the selected units when the same displayed number changes meaning', () => {
    const raw = { sodium: '140', urineSodium: '20', creatinine: '1', urineCreatinine: '100' };
    const a = fenaEvaluation(raw, {}).pose!,
      b = fenaEvaluation(raw, { creatinine: 1 }).pose!;
    expect(b.result).toBeCloseTo(a.result / 88.4, 12);
    expect(b.heights.creatinine).toBeCloseTo(a.heights.creatinine / 88.4, 12);
  });
  it('preserves ratio geometry across a shared concentration multiplier', () => {
    expect(fenaPose({ ...fenaExample, creatinine: 2, urineCreatinine: 200 })!.heights).toEqual(
      fenaPose(fenaExample)!.heights,
    );
  });
  it.each([
    { sodium: 1e-6, urineSodium: 1e6, creatinine: 1e6, urineCreatinine: 1e-6 },
    { sodium: 1e6, urineSodium: 0, creatinine: 1e-6, urineCreatinine: 1e6 },
    { sodium: 1e-6, urineSodium: 1e-6, creatinine: 1e-6, urineCreatinine: 1e-6 },
  ])('keeps unbounded registry values proportional and fitted: %j', (v) => {
    const p = fenaPose(v)!;
    expect(p.result).toBe(fenaCalculator.calculate(v));
    for (const h of Object.values(p.heights)) {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(76);
    }
    expect(p.heights.urineSodium / p.heights.sodium).toBeCloseTo(p.sodiumRatio, 3);
  });
  it('hides geometry for blank, incomplete, malformed and out-of-range values', () => {
    const raw = Object.fromEntries(Object.entries(fenaExample).map(([k, v]) => [k, String(v)]));
    for (const field of fenaInputs) {
      for (const invalid of ['', 'abc', '-1', 'Infinity'])
        expect(fenaEvaluation({ ...raw, [field]: invalid }, {}).pose).toBeNull();
      expect(fenaPose({ ...fenaExample, [field]: NaN })).toBeNull();
    }
    for (const field of ['sodium', 'creatinine', 'urineCreatinine'])
      expect(fenaPose({ ...fenaExample, [field]: 0 })).toBeNull();
  });
});
