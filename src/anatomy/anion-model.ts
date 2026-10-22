import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const anionCalculator = calculators.find((c) => c.id === 'anionenluecke')!;
export const anionExample = { sodium: 140, chloride: 104, bicarbonate: 24 };
export const anionInputs = ['sodium', 'chloride', 'bicarbonate'] as const;
export function anionPose(values: Values) {
  if (
    anionCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? 0) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const { sodium, chloride, bicarbonate } = values,
    result = anionCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  // Normalize before forming Cl + HCO3, which can overflow despite a finite AG.
  const high = Math.max(180, sodium, chloride, bicarbonate);
  const normalized = [sodium / high, chloride / high, bicarbonate / high];
  const extent = Math.max(180 / high, normalized[0], normalized[1] + normalized[2]);
  const factor = 180 / extent,
    unit = factor / high;
  const heights = normalized.map((v) => v * factor);
  const totalHeight = heights[1] + heights[2];
  const gapStart = Math.min(heights[0], totalHeight),
    gapHeight = (Math.abs(result) / high) * factor;
  return {
    sodium,
    chloride,
    bicarbonate,
    result,
    heights,
    totalHeight,
    gapStart,
    gapHeight,
    unit,
    controlMax: Math.max(200, high),
    sign: Math.sign(result),
    measured: Number.isFinite(chloride + bicarbonate) ? chloride + bicarbonate : null,
  };
}
export type AnionPose = NonNullable<ReturnType<typeof anionPose>>;
