import { calculators, evaluateCalculator } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const osmolalityCalculator = calculators.find((c) => c.id === 'osmolalitaet')!;
export const osmolalityInputs = ['sodium', 'glucose', 'urea'] as const;
export const osmolalityExample = { sodium: 140, glucose: 100, urea: 5 };
export const osmolalityCenters = [-104, -54, 23, 96];
export function osmolalityPose(values: Values) {
  if (
    osmolalityCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? -Infinity) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const contributions = [2 * values.sodium, values.glucose / 18.0182, values.urea];
  const doses = [values.sodium, values.sodium, contributions[1], contributions[2]];
  const result = osmolalityCalculator.calculate(values);
  if (!Number.isFinite(result) || result <= 0) return null;
  const unit = Math.min(0.75, 252 / result);
  const capacity = 10 * 64 + (14 / 64) * 64 ** 2;
  const doseUnit = Math.min(7, capacity / Math.max(...doses));
  // Stable positive root of slope*h² + 10*h = dose*doseUnit.
  const heights = doses.map((dose) => {
    const area = dose * doseUnit;
    return (2 * area) / (10 + Math.sqrt(100 + 4 * (14 / 64) * area));
  });
  return {
    contributions,
    doses,
    result,
    unit,
    doseUnit,
    heights,
    lengths: contributions.map((v) => v * unit),
    values,
  };
}
export function evaluateOsmolality(
  raw: Record<string, string>,
  units: Record<string, number> = {},
) {
  const evaluation = evaluateCalculator(osmolalityCalculator, raw, units);
  return {
    evaluation,
    pose: evaluation.result === null ? null : osmolalityPose(evaluation.values),
  };
}
export type OsmolalityPose = NonNullable<ReturnType<typeof osmolalityPose>>;
