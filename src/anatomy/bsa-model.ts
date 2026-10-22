import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';

export const bsaCalculator = calculators.find((c) => c.id === 'koerperoberflaeche')!;
export const bsaExample = { height: 175, weight: 75 };
export function bsaPose(values: Values, form = 0) {
  if (
    bsaCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? 0) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const result = bsaCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  const a = values.height / 60,
    b = values.weight / 60,
    area = a * b;
  const t = Math.max(0, Math.min(1, form));
  // Morph the side ratio multiplicatively; the other side follows from constant area.
  const width = Math.exp((1 - t) * Math.log(a) + t * Math.log(result));
  const depth = area / width;
  // Keep one display scale throughout the morph, fitting extreme inputs to the frame.
  const unit = Math.min(52, 180 / Math.max(a, b));
  return {
    height: values.height,
    weight: values.weight,
    result,
    a,
    b,
    area,
    form: t,
    width,
    depth,
    unit,
    w: width * unit,
    h: depth * unit,
  };
}
export type BsaPose = NonNullable<ReturnType<typeof bsaPose>>;
