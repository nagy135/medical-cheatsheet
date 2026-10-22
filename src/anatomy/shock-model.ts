import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';

export const shockCalculator = calculators.find((c) => c.id === 'schockindex')!;
export const shockExample = { heartRate: 90, systolic: 120 };
export function shockPose(values: Values) {
  if (
    shockCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? 0) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const { heartRate, systolic } = values;
  const result = shockCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  // Divide by the larger value before summing to avoid overflow for valid finite inputs.
  const scale = Math.max(180, heartRate, systolic);
  const left = heartRate / scale,
    right = systolic / scale;
  const pivot = (100 * (right - left)) / (right + left);
  // Derive arms from normalized numbers, avoiding cancellation near a beam end.
  const leftArm = (200 * right) / (left + right),
    rightArm = (200 * left) / (left + right);
  return {
    heartRate,
    systolic,
    result,
    scale,
    pivot,
    leftArm,
    rightArm,
    heights: [48 * left, 48 * right],
  };
}
export type ShockPose = NonNullable<ReturnType<typeof shockPose>>;
