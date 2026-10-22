import { calculators } from '../calculators.ts';
import type { Values } from '../calculators.ts';
export const bazettCalculator = calculators.find((c) => c.id === 'qtc-bazett')!;
export const bazettExample = { qt: 400, heartRate: 75 };
export const bazettInputs = ['heartRate', 'qt'] as const;
export function bazettPose(values: Values) {
  if (
    bazettCalculator.fields.some(
      (f) =>
        !Number.isFinite(values[f.id]) ||
        values[f.id] < (f.min ?? 0) ||
        values[f.id] > (f.max ?? Infinity),
    )
  )
    return null;
  const { qt, heartRate } = values,
    rr = 60 / heartRate,
    root = Math.sqrt(rr),
    gain = 1 / root,
    result = bazettCalculator.calculate(values);
  if (!Number.isFinite(result)) return null;
  const logQT = Math.log(qt / 400),
    logGain = Math.log(gain),
    logResult = logQT + logGain;
  const radians = Math.PI / 180;
  const k = Math.min(
    (80 * radians) / Math.LN2,
    (105 * radians) / Math.max(0.6, Math.abs(logQT), Math.abs(logGain), Math.abs(logResult)),
  );
  return {
    qt,
    heartRate,
    rr,
    root,
    gain,
    result,
    k,
    qtAngle: k * logQT,
    gainAngle: k * logGain,
    resultAngle: k * logResult,
  };
}
export type BazettPose = NonNullable<ReturnType<typeof bazettPose>>;
