import { calculators, evaluateCalculator } from '../calculators.ts';
import type { Values } from '../calculators.ts';

export const fenaCalculator = calculators.find((c) => c.id === 'fena')!;
export const fenaInputs = ['sodium', 'urineSodium', 'creatinine', 'urineCreatinine'] as const;
export type FenaInput = (typeof fenaInputs)[number];
export const fenaExample = { sodium: 140, urineSodium: 20, creatinine: 1, urineCreatinine: 100 };
export const fenaPositions: Record<FenaInput, [number, number]> = {
  sodium: [-108, -8],
  urineSodium: [-48, -8],
  creatinine: [42, -8],
  urineCreatinine: [102, -8],
};
export function fenaPose(v: Values) {
  if (
    fenaCalculator.fields.some(
      (f) => !Number.isFinite(v[f.id]) || v[f.id] < (f.min ?? 0) || v[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const result = fenaCalculator.calculate(v);
  const sodiumRatio = v.urineSodium / v.sodium;
  const creatinineRatio = v.urineCreatinine / v.creatinine;
  const sodiumScale = Math.max(v.sodium, v.urineSodium);
  const creatinineScale = Math.max(v.creatinine, v.urineCreatinine);
  if (![result, sodiumRatio, creatinineRatio].every(Number.isFinite)) return null;
  const heights: Record<FenaInput, number> = {
    sodium: 76 * (v.sodium / sodiumScale),
    urineSodium: 76 * (v.urineSodium / sodiumScale),
    creatinine: 76 * (v.creatinine / creatinineScale),
    urineCreatinine: 76 * (v.urineCreatinine / creatinineScale),
  };
  return { result, sodiumRatio, creatinineRatio, sodiumScale, creatinineScale, heights };
}
export type FenaPose = NonNullable<ReturnType<typeof fenaPose>>;
export function fenaEvaluation(raw: Record<string, string>, units: Record<string, number> = {}) {
  const evaluation = evaluateCalculator(fenaCalculator, raw, units);
  return { ...evaluation, pose: evaluation.result === null ? null : fenaPose(evaluation.values) };
}
export function fenaRaw(field: FenaInput, value: number, units: Record<string, number>) {
  const f = fenaCalculator.fields.find((f) => f.id === field)!;
  return String(
    Number((value / (f.units?.[units[field] ?? 0]?.factor ?? 1)).toPrecision(12)),
  ).replace('.', ',');
}
