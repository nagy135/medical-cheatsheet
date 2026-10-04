import { parseGermanNumber } from './calculators';
import type { Field } from './calculators';

export function numericFieldSettings(field: Field, unitIndex = 0) {
  const unit = field.units?.[unitIndex];
  const factor = unit?.factor ?? 1;
  const step = unit?.step ?? field.step ?? 1;
  return {
    step,
    min: field.min === undefined ? undefined : field.min / factor,
    max: field.max === undefined ? undefined : field.max / factor,
  };
}

export function stepNumericValue(field: Field, raw: string, direction: 1 | -1, unitIndex = 0) {
  const value = parseGermanNumber(raw);
  if (raw.trim() && (value === null || (field.integer && !Number.isInteger(value)))) return raw;

  const { step, min, max } = numericFieldSettings(field, unitIndex);
  // Keep button-generated boundary values on the selected unit's step grid.
  // This also avoids rounding a converted lower bound below the valid range.
  const lower =
    min === undefined ? -Infinity : Number((Math.ceil(min / step) * step).toPrecision(12));
  const upper =
    max === undefined ? Infinity : Number((Math.floor(max / step) * step).toPrecision(12));
  if (
    value !== null &&
    ((direction === -1 && value <= lower) || (direction === 1 && value >= upper))
  )
    return raw;

  const next = Math.max(
    lower,
    Math.min(upper, value === null ? Math.max(step, lower) : value + direction * step),
  );
  return Number(next.toPrecision(12)).toLocaleString('de-DE', {
    useGrouping: false,
    maximumFractionDigits: 12,
  });
}
