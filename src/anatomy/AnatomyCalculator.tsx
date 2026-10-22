import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpToLine, Pause, Play, RotateCcw } from 'lucide-react';
import { evaluateCalculator, formatNumber, parseGermanNumber } from '../calculators';
import type { Calculator, Field } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { anatomySpecs, canonicalRaw, exampleRaw, importMainValues, inputInterval } from './model';
import { Plotter } from './Plotter';
import './iso.css';
import './anatomy.css';

export function AnatomyCalculator({
  calculator,
  mainRaw,
  mainUnits,
  onApply,
}: {
  calculator: Calculator;
  mainRaw: Record<string, string>;
  mainUnits: Record<string, number>;
  onApply: (raw: Record<string, string>) => void;
}) {
  const spec = anatomySpecs[calculator.id];
  const [raw, setRaw] = useState(() => exampleRaw(calculator));
  const [units, setUnits] = useState<Record<string, number>>({});
  const [axisId, setAxisId] = useState(spec.axis);
  const [touring, setTouring] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [status, setStatus] = useState('Start mit Beispielwerten; unabhängig vom Formular oben.');
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setTouring(false);
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const evaluation = evaluateCalculator(calculator, raw, units);
  const axis = calculator.fields.find((f) => f.id === axisId)!;
  const imported = importMainValues(calculator, mainRaw, mainUnits);
  const change = (id: string, value: string) => {
    setRaw((prev) => ({ ...prev, [id]: value }));
    setTouring(false);
    setStatus('Eigene Eingaben im interaktiven Rechner.');
  };
  const canonicalInput = (field: Field, value: number) => {
    const factor = field.units?.[units[field.id] ?? 0]?.factor ?? 1;
    change(field.id, String(Number((value / factor).toPrecision(10))).replace('.', ','));
  };
  const changeUnit = (field: Field, next: number) => {
    const value = parseGermanNumber(raw[field.id] ?? '');
    const previous = units[field.id] ?? 0;
    if (value !== null && field.units)
      change(
        field.id,
        String(
          Number(
            ((value * field.units[previous].factor) / field.units[next].factor).toPrecision(12),
          ),
        ).replace('.', ','),
      );
    setUnits((prev) => ({ ...prev, [field.id]: next }));
    setTouring(false);
  };
  const result = evaluation.result;
  const steps = result === null ? [] : spec.steps(evaluation.values);
  return (
    <section
      className="anatomy-panel"
      aria-labelledby={`anatomy-title-${calculator.id}`}
      data-anatomy={calculator.id}
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · DIE RECHNUNG BEGREIFEN</span>
          <h2 id={`anatomy-title-${calculator.id}`}>Interaktiv berechnen</h2>
          <p>{spec.explanation}</p>
        </div>
        <span className="anatomy-method">{calculator.abbreviation}</span>
      </header>
      <div className="anatomy-workbench">
        <div className="anatomy-visual">
          <div className="anatomy-axis">
            <label htmlFor={`anatomy-axis-${calculator.id}`}>
              X-Achse · diese Eingabe variieren
            </label>
            <select
              id={`anatomy-axis-${calculator.id}`}
              value={axisId}
              onChange={(event) => {
                setAxisId(event.target.value);
                setTouring(false);
              }}
            >
              {calculator.fields
                .filter((f) => !f.options)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
            </select>
          </div>
          <Plotter
            calculator={calculator}
            values={result === null ? null : evaluation.values}
            axis={axis}
            unitIndex={units[axis.id] ?? 0}
            touring={touring}
            onInput={(value) => canonicalInput(axis, value)}
          />
          <button
            className="anatomy-tour"
            aria-pressed={touring}
            disabled={result === null || reducedMotion}
            onClick={() => setTouring(!touring)}
          >
            {touring ? <Pause size={14} /> : <Play size={14} />}
            {reducedMotion
              ? 'Bewegung laut Geräteeinstellung reduziert'
              : touring
                ? 'Kurvenfahrt beenden'
                : 'Kurve abfahren'}
            {!reducedMotion && <span>ändert keine Formularwerte</span>}
          </button>
        </div>
        <div className="anatomy-inputs">
          <h3>Werte am Instrument</h3>
          {calculator.fields.map((field) => {
            const factor = field.units?.[units[field.id] ?? 0]?.factor ?? 1;
            const value = parseGermanNumber(raw[field.id] ?? '');
            const range = field.options
              ? null
              : inputInterval(calculator, field, value === null ? undefined : value * factor);
            return (
              <div
                className={`anatomy-field ${axis.id === field.id ? 'anatomy-selected' : ''}`}
                key={field.id}
              >
                <label id={`anatomy-label-${field.id}`} htmlFor={`anatomy-${field.id}`}>
                  {field.label}
                </label>
                {field.options ? (
                  <div
                    className="segmented-control"
                    role="group"
                    aria-labelledby={`anatomy-label-${field.id}`}
                  >
                    {field.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={raw[field.id] === option.value ? 'selected' : ''}
                        aria-pressed={raw[field.id] === option.value}
                        onClick={() => change(field.id, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <NumericInput
                      field={field}
                      value={raw[field.id] ?? ''}
                      unitIndex={units[field.id] ?? 0}
                      error={evaluation.errors[field.id]}
                      idPrefix="anatomy"
                      onChange={(next) => change(field.id, next)}
                      onUnitChange={(next) => changeUnit(field, next)}
                    />
                    <input
                      className="anatomy-range"
                      type="range"
                      aria-label={`${field.label} am Instrument einstellen`}
                      min={range![0] / factor}
                      max={range![1] / factor}
                      step={numericFieldSettings(field, units[field.id] ?? 0).step}
                      value={value ?? range![0] / factor}
                      onChange={(event) => change(field.id, event.target.value)}
                    />
                  </>
                )}
                {evaluation.errors[field.id] && (
                  <span className="field-error" id={`anatomy-error-${field.id}`}>
                    {evaluation.errors[field.id]}
                  </span>
                )}
                {field.hint && (
                  <span className="anatomy-field-hint" id={`anatomy-hint-${field.id}`}>
                    {field.hint}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <div className="anatomy-calculation">
        <div className="anatomy-steps">
          {steps.map((step) => (
            <div key={step.label}>
              <span>{step.label}</span>
              <strong>
                {formatNumber(step.value, Math.abs(step.value) < 0.01 && step.value !== 0 ? 6 : 3)}{' '}
                <small>{step.unit}</small>
              </strong>
            </div>
          ))}
          {!steps.length && (
            <p>Bitte alle Eingaben prüfen, um die Rechnung und den Stift anzuzeigen.</p>
          )}
        </div>
        <div className="anatomy-result" aria-live="polite" aria-atomic="true">
          <span>Ergebnis Ihrer Eingaben</span>
          <strong data-anatomy-result>
            {result === null ? '—' : formatNumber(result, calculator.precision)}
          </strong>
          <small>{calculator.resultUnit || 'Dimensionsloser Index'}</small>
        </div>
      </div>
      <div className="anatomy-formula">
        {calculator.formula}
        {calculator.formulaDetail && <span>{calculator.formulaDetail}</span>}
      </div>
      <footer className="anatomy-actions">
        <div>
          <button
            disabled={!imported}
            onClick={() => {
              if (!imported) return;
              setRaw(imported);
              setUnits({});
              setTouring(false);
              setStatus('Werte aus dem Formular oben übernommen.');
            }}
          >
            <ArrowDownToLine size={15} />
            Werte von oben übernehmen
          </button>
          <button
            disabled={result === null}
            onClick={() => {
              onApply(canonicalRaw(evaluation.values));
              setStatus('Werte ins Formular oben übernommen.');
            }}
          >
            <ArrowUpToLine size={15} />
            Werte oben einsetzen
          </button>
          <button
            onClick={() => {
              setRaw(exampleRaw(calculator));
              setUnits({});
              setAxisId(spec.axis);
              setTouring(false);
              setStatus('Beispielwerte wiederhergestellt.');
            }}
          >
            <RotateCcw size={14} />
            Beispiel
          </button>
        </div>
        <p role="status">{status}</p>
      </footer>
    </section>
  );
}
