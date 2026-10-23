import { calculators, evaluateCalculator } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const pbwCalculator = calculators.find((c) => c.id === 'atemzugvolumen')!;
export const pbwExample = { height: 175, sex: 1 };
export const pbwCenters = Array.from({ length: 6 }, (_, i) => {
  const angle = (i * Math.PI) / 3;
  return [60 * Math.cos(angle), 60 * Math.sin(angle)];
});
export function pbwPose(values: Values) {
  const evaluation = evaluateCalculator(
    pbwCalculator,
    Object.fromEntries(
      pbwCalculator.fields.map((field) => [field.id, String(values[field.id] ?? '')]),
    ),
  );
  if (evaluation.result === null) return null;
  const result = evaluation.result;
  return {
    height: values.height,
    sex: values.sex,
    baseline: values.sex === 1 ? 50 : 45.5,
    pbw: result / 6,
    result,
    measureHeight: result / 12,
    selectorX: values.sex === 1 ? 59 : 45,
  };
}
export type PbwPose = NonNullable<ReturnType<typeof pbwPose>>;
