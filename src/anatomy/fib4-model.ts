import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const fib4Calculator = calculators.find((c) => c.id === 'fib4')!;
export const fib4Inputs = ['age', 'ast', 'platelets', 'alt'] as const;
export const fib4Example = { age: 60, ast: 40, platelets: 200, alt: 35 };
export const fib4Domains = { age: 120, ast: 200, platelets: 400, alt: 140 };
export function fib4Pose(v: Values, transient = false) {
  if (
    fib4Calculator.fields.some(
      (f) =>
        !Number.isFinite(v[f.id]) ||
        v[f.id] < (f.min ?? 0) ||
        v[f.id] > (f.max ?? Infinity) ||
        (!transient && f.integer && !Number.isInteger(v[f.id])),
    )
  )
    return null;
  const result = fib4Calculator.calculate(v),
    numerator = v.age * v.ast,
    rootALT = Math.sqrt(v.alt),
    denominator = v.platelets * rootALT;
  if (![result, numerator, denominator].every(Number.isFinite)) return null;
  const domains = Object.fromEntries(
    fib4Inputs.map((id) => [id, Math.max(fib4Domains[id], v[id])]),
  ) as Record<(typeof fib4Inputs)[number], number>;
  const positions = fib4Inputs.map((id, i) => ({
    x: -117 + i * 52,
    y: -54 + (88 * v[id]) / domains[id],
    z: 11 + 32 * (id === 'alt' ? Math.sqrt(v[id] / domains[id]) : v[id] / domains[id]),
  }));
  // The probe runs on the visible side face, one unit below the analytic cam edge.
  const contacts = positions.map((p) => ({ x: p.x + 11, y: p.y, z: p.z - 1 }));
  const registerUnit = Math.min(0.02, 76 / Math.max(numerator, denominator));
  const quotientMax = Math.max(4, result);
  return {
    age: v.age,
    ast: v.ast,
    platelets: v.platelets,
    alt: v.alt,
    result,
    numerator,
    denominator,
    rootALT,
    domains,
    positions,
    contacts,
    registerUnit,
    numeratorLength: numerator * registerUnit,
    denominatorLength: denominator * registerUnit,
    quotientMax,
    quotientLength: (76 * result) / quotientMax,
  };
}
export type Fib4Pose = NonNullable<ReturnType<typeof fib4Pose>>;
