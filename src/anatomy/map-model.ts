import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';

export const mapCalculator = calculators.find((calculator) => calculator.id === 'map')!;
export const mapExample = { systolic: 120, diastolic: 80 };
export const pressureHeight = (pressure: number, scale = 240) => 30 + (130 * pressure) / scale;

export function mapPose(values: Values) {
  if (
    mapCalculator.fields.some(
      (field) => !Number.isFinite(values[field.id]) || values[field.id] < (field.min ?? 0),
    ) ||
    mapCalculator.validate?.(values)
  )
    return null;
  const result = mapCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  const scale = Math.max(240, Math.ceil(Math.max(values.systolic, values.diastolic) / 40) * 40);
  return {
    systolic: values.systolic,
    diastolic: values.diastolic,
    result,
    scale,
    pulse: values.systolic - values.diastolic,
    rise: (values.systolic - values.diastolic) / 3,
    heights: [values.diastolic, result, values.systolic].map((value) =>
      pressureHeight(value, scale),
    ),
  };
}
export type MapPose = NonNullable<ReturnType<typeof mapPose>>;
