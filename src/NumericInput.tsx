import type { Ref } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber, parseGermanNumber } from './calculators';
import type { Field } from './calculators';
import { numericFieldSettings, stepNumericValue } from './numeric-input';

export function NumericInput({
  field,
  value,
  unitIndex,
  error,
  inputRef,
  idPrefix = 'field',
  onChange,
  onUnitChange,
}: {
  field: Field;
  value: string;
  unitIndex: number;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  idPrefix?: string;
  onChange: (value: string) => void;
  onUnitChange: (unitIndex: number) => void;
}) {
  const { min, max, step } = numericFieldSettings(field, unitIndex);
  const increased = stepNumericValue(field, value, 1, unitIndex);
  const decreased = stepNumericValue(field, value, -1, unitIndex);
  const unitLabel = field.units?.[unitIndex]?.label ?? field.unit ?? '';
  return (
    <div className={`input-wrap ${error ? 'input-error' : ''}`}>
      <input
        ref={inputRef}
        id={`${idPrefix}-${field.id}`}
        type="text"
        role="spinbutton"
        inputMode={field.integer ? 'numeric' : 'decimal'}
        autoComplete="off"
        placeholder={`z. B. ${field.example}`}
        value={value}
        aria-valuenow={parseGermanNumber(value) ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${idPrefix === 'field' ? '' : idPrefix + '-'}error-${field.id}`
            : field.hint
              ? `${idPrefix === 'field' ? '' : idPrefix + '-'}hint-${field.id}`
              : undefined
        }
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            onChange(event.key === 'ArrowUp' ? increased : decreased);
          }
        }}
      />
      {field.units ? (
        <select
          aria-label={`Einheit für ${field.label}`}
          value={unitIndex}
          onChange={(event) => onUnitChange(Number(event.target.value))}
        >
          {field.units.map((unit, i) => (
            <option key={unit.label} value={i}>
              {unit.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="field-unit">{field.unit}</span>
      )}
      <div className="number-stepper">
        <button
          type="button"
          aria-label={`${field.label} erhöhen`}
          title={`Um ${formatNumber(step, 2)} ${unitLabel} erhöhen`}
          disabled={increased === value}
          onClick={() => onChange(increased)}
        >
          <ChevronUp size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`${field.label} verringern`}
          title={`Um ${formatNumber(step, 2)} ${unitLabel} verringern`}
          disabled={decreased === value}
          onClick={() => onChange(decreased)}
        >
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
