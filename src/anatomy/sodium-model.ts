import { calculators, evaluateCalculator } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const sodiumCalculator = calculators.find((c) => c.id === 'natrium')!;
export const sodiumInputs = ['sodium', 'glucose'] as const;
export const sodiumExample = { sodium: 130, glucose: 400 };
export function sodiumPose(v: Values) {
  if (
    sodiumCalculator.fields.some(
      (f) =>
        !Number.isFinite(v[f.id]) ||
        v[f.id] < (f.min ?? -Infinity) ||
        v[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const result = sodiumCalculator.calculate(v);
  if (!Number.isFinite(result)) return null;
  const excess = v.glucose - 100;
  const correction = 1.6 * (excess / 100);
  const correctionRange = Math.max(40, correction / 0.9);
  const unit = 100 / Math.max(170, v.sodium + correctionRange);
  const slope = (correctionRange * unit) / 224;
  const travel = (224 * correction) / correctionRange;
  return {
    sodium: v.sodium,
    glucose: v.glucose,
    result,
    excess,
    correction,
    correctionRange,
    glucoseRange: (correctionRange / 1.6) * 100,
    unit,
    slope,
    travel,
    datum: 12 + v.sodium * unit,
    rise: correction * unit,
    x: -112 + travel,
  };
}
export function sodiumState(raw: Record<string, string>, units: Record<string, number>) {
  const evaluation = evaluateCalculator(sodiumCalculator, raw, units);
  return { ...evaluation, pose: evaluation.result === null ? null : sodiumPose(evaluation.values) };
}
export type SodiumPose = NonNullable<ReturnType<typeof sodiumPose>>;
