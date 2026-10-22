import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const calciumCalculator = calculators.find((c) => c.id === 'kalzium')!;
export const calciumInputs = ['calcium', 'albumin'] as const;
export const calciumExample = { calcium: 2.1, albumin: 30 };
export function calciumPose(values: Values) {
  if (
    calciumCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? 0) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const { calcium, albumin } = values,
    result = calciumCalculator.calculate(values),
    correction = 0.02 * (40 - albumin),
    unit = Math.min(36, 120 / calcium),
    measuredX = -70 + calcium * unit,
    resultX = measuredX + correction * unit;
  if (!Number.isFinite(result)) return null;
  return {
    calcium,
    albumin,
    result,
    correction,
    unit,
    measuredX,
    resultX,
    offset: correction * unit,
    scale: 120 / unit,
  };
}
export type CalciumPose = NonNullable<ReturnType<typeof calciumPose>>;
export function calciumRaw(field: string, value: number, units: Record<string, number>) {
  const f = calciumCalculator.fields.find((f) => f.id === field)!;
  return String(
    Number((value / (f.units?.[units[field] ?? 0]?.factor ?? 1)).toPrecision(12)),
  ).replace('.', ',');
}
