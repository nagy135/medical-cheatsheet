import { calculators, evaluateCalculator } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const bmiCalculator = calculators.find((c) => c.id === 'bmi')!;
export const bmiInputs = ['weight', 'height'] as const;
export const bmiExample = { weight: 75, height: 175 };
export function bmiPose(values: Values) {
  if (
    bmiCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? -Infinity) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const result = bmiCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  const side = values.height * 0.5;
  const verticalScale = Math.min(1.35, 70 / result);
  return {
    weight: values.weight,
    height: values.height,
    meters: values.height / 100,
    area: (values.height / 100) ** 2,
    result,
    side,
    verticalScale,
    thickness: result * verticalScale,
    volume: side ** 2 * result * verticalScale,
  };
}
export function bmiEvaluation(raw: Record<string, string>, units: Record<string, number>) {
  const evaluation = evaluateCalculator(bmiCalculator, raw, units);
  return { ...evaluation, pose: evaluation.result === null ? null : bmiPose(evaluation.values) };
}
export type BmiPose = NonNullable<ReturnType<typeof bmiPose>>;
