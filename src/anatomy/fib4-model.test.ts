import { describe, it, expect } from 'vitest';
import { evaluateCalculator } from '../calculators';
import { fib4Calculator, fib4Inputs, fib4Pose, fib4Example } from './fib4-model';
describe('FIB-4 shaped cam comparator', () => {
  it('shares the original formula and exact two-register ratio', () => {
    const p = fib4Pose(fib4Example)!;
    expect(p.numerator).toBe(2400);
    expect(p.rootALT).toBe(Math.sqrt(35));
    expect(p.result).toBeCloseTo(2.02837021134844, 12);
    expect(p.numeratorLength / p.denominatorLength).toBeCloseTo(p.result, 12);
  });
  it.each([
    ['age', 120, 2],
    ['ast', 80, 2],
    ['platelets', 400, 0.5],
    ['alt', 140, 0.5],
  ] as const)('moves %s alone and gives the true relative result', (id, value, factor) => {
    const a = fib4Pose(fib4Example)!,
      b = fib4Pose({ ...fib4Example, [id]: value })!;
    expect(b.result / a.result).toBeCloseTo(factor, 12);
    fib4Inputs.forEach((field, i) => {
      if (field === id) expect(b.positions[i]).not.toEqual(a.positions[i]);
      else expect(b.positions[i]).toEqual(a.positions[i]);
    });
    expect(b.numeratorLength / b.denominatorLength).toBeCloseTo(b.result, 12);
  });
  it('represents ALT with an analytic square-root height and a quarter input gives half lift', () => {
    const a = fib4Pose({ ...fib4Example, alt: 140 })!,
      b = fib4Pose(fib4Example)!;
    expect((b.positions[3].z - 11) / (a.positions[3].z - 11)).toBe(0.5);
    expect((b.positions[3].y + 54) / (a.positions[3].y + 54)).toBe(0.25);
  });
  it.each([1e-6, 0.01, 1, 1e6, 1e100])(
    'expands drawing scales without clipping numeric value %s',
    (n) => {
      const p = fib4Pose({ age: 60, ast: n, platelets: 1e-6, alt: 35 })!;
      expect(p.result).toBe(
        fib4Calculator.calculate({ age: 60, ast: n, platelets: 1e-6, alt: 35 }),
      );
      expect(p.numeratorLength).toBeLessThanOrEqual(76.00000001);
      expect(p.quotientLength).toBeLessThanOrEqual(76.00000001);
      expect(p.positions[1].y).toBeLessThanOrEqual(34);
    },
  );
  it('rejects blanks, invalid ages, zero terms and nonfinite numbers', () => {
    for (const id of fib4Inputs) {
      expect(
        evaluateCalculator(fib4Calculator, {
          age: '60',
          ast: '40',
          platelets: '200',
          alt: '35',
          [id]: '',
        }).result,
      ).toBeNull();
      expect(fib4Pose({ ...fib4Example, [id]: NaN })).toBeNull();
      expect(fib4Pose({ ...fib4Example, [id]: 0 })).toBeNull();
    }
    expect(fib4Pose({ ...fib4Example, age: 60.5 })).toBeNull();
    expect(fib4Pose({ ...fib4Example, age: 121 })).toBeNull();
  });
  it('uses canonical evaluation and the current registry has no alternative units or categories', () => {
    expect(fib4Calculator.fields.every((f) => !f.units && !f.options)).toBe(true);
    const raw = { age: '60', ast: '40,5', platelets: '200', alt: '35' };
    const e = evaluateCalculator(fib4Calculator, raw, {});
    expect(fib4Pose(e.values)!.result).toBe(e.result);
  });
});
