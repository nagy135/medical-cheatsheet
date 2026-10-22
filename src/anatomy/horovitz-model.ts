import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const horovitzCalculator = calculators.find((c) => c.id === 'horovitz')!;
export const horovitzExample = { pao2: 80, fio2: 40 };
export const horovitzInputs = ['fio2', 'pao2'] as const;
export function horovitzPose(values: Values) {
  if (
    horovitzCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? 0) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const { pao2, fio2 } = values,
    fraction = fio2 / 100,
    result = horovitzCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  const scale = Math.max(400, pao2, result),
    unit = 180 / scale;
  return {
    pao2,
    fio2,
    fraction,
    result,
    scale,
    unit,
    oxygenWidth: 96 * fraction,
    heights: [(pao2 / scale) * 180, (result / scale) * 180],
    gain: 1 / fraction,
  };
}
export type HorovitzPose = NonNullable<ReturnType<typeof horovitzPose>>;
export function horovitzRaw(field: string, value: number, units: Record<string, number>) {
  const definition = horovitzCalculator.fields.find((f) => f.id === field)!;
  const factor = definition.units?.[units[field] ?? 0]?.factor ?? 1;
  return String(Number((value / factor).toPrecision(12))).replace('.', ',');
}
