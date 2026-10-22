import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const waterCalculator = calculators.find((c) => c.id === 'wasserdefizit')!;
export const waterInputs = ['weight', 'sodium', 'bodyWaterFraction'] as const;
export const waterExample = { weight: 70, sodium: 170, bodyWaterFraction: 0.6 };
export function waterPose(v: Values) {
  if (
    waterCalculator.fields.some(
      (f) => !Number.isFinite(v[f.id]) || v[f.id] < (f.min ?? 0) || v[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const tbw = v.weight * v.bodyWaterFraction,
    result = waterCalculator.calculate(v),
    total = tbw + result;
  if (!Number.isFinite(total) || !Number.isFinite(result)) return null;
  const unit = Math.min(3.6, 240 / total);
  return {
    weight: v.weight,
    sodium: v.sodium,
    bodyWaterFraction: v.bodyWaterFraction,
    tbw,
    result,
    total,
    unit,
    ratio: v.sodium / 140,
    currentLength: tbw * unit,
    extraLength: result * unit,
    totalLength: Math.min(240, total * unit),
    scale: 240 / unit,
  };
}
export type WaterPose = NonNullable<ReturnType<typeof waterPose>>;
