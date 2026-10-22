import { evaluateCalculator, formatNumber, parseGermanNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { CalciumInstrument } from './CalciumInstrument';
import { calciumCalculator, calciumInputs, calciumPose, calciumRaw } from './calcium-model';
import './iso.css';
import './anatomy.css';
import './calcium.css';
export function CalciumAnatomy({
  raw,
  units,
  onChange,
  onUnitChange,
  onPreset,
}: {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const evaluation = evaluateCalculator(calciumCalculator, raw, units),
    pose = evaluation.result === null ? null : calciumPose(evaluation.values);
  const steps = Object.fromEntries(
    calciumCalculator.fields.map((f) => [
      f.id,
      numericFieldSettings(f, units[f.id] ?? 0).step * (f.units?.[units[f.id] ?? 0].factor ?? 1),
    ]),
  );
  return (
    <section
      className="anatomy-panel calcium-panel"
      aria-labelledby="anatomy-title-calcium"
      data-anatomy="kalzium"
      data-instrument="compound-slide"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-calcium">Der Korrekturschlitten</h2>
          <p>
            Kalzium bewegt den unteren Schlitten. Albumin setzt den Versatz auf dessen zweiter
            Schiene: 0,02 × (40 − Albumin). Der helle Kopf zeigt die Summe. Die Korrektur kann
            positiv, null oder negativ sein.
          </p>
        </div>
        <span className="anatomy-method">Ca gemessen + Korrektur</span>
      </header>
      <CalciumInstrument
        values={pose ? evaluation.values : null}
        steps={steps}
        onInput={(field, value) => onChange(field, calciumRaw(field, value, units))}
      />
      <div className="calcium-controls">
        {calciumInputs.map((id) => {
          const field = calciumCalculator.fields.find((f) => f.id === id)!,
            index = units[id] ?? 0,
            settings = numericFieldSettings(field, index),
            factor = field.units?.[index].factor ?? 1;
          return (
            <div className="calcium-input" key={id}>
              <label htmlFor={`anatomy-${id}`}>
                {id === 'calcium'
                  ? 'Links · Kalzium → unterer Schlitten'
                  : 'Rechts · Albumin → relativer Versatz'}
              </label>
              <NumericInput
                idPrefix="anatomy"
                field={field}
                value={raw[id] ?? ''}
                unitIndex={index}
                error={evaluation.errors[id]}
                onChange={(value) => onChange(id, value)}
                onUnitChange={(index) => onUnitChange(id, index)}
              />
              <input
                type="range"
                className="anatomy-range"
                min={settings.step}
                max={settings.max ?? Math.max(5, evaluation.values[id] ?? 5) / factor}
                step={settings.step}
                value={
                  parseGermanNumber(raw[id] ?? '') ??
                  (parseGermanNumber(field.example) ?? 0) / factor
                }
                aria-label={`${field.label} am Korrekturschlitten einstellen`}
                onChange={(e) => onChange(id, e.target.value)}
              />
              {evaluation.errors[id] && (
                <span className="field-error" id={`anatomy-error-${id}`}>
                  {evaluation.errors[id]}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="calcium-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Gemessenes Kalzium + Korrektur</span>
          <code>
            {pose
              ? `${formatNumber(pose.calcium, 2)} ${pose.correction < 0 ? '−' : '+'} ${formatNumber(Math.abs(pose.correction), 2)}`
              : 'Ca + 0,02 × (40 − Alb)'}
          </code>
        </div>
        <div>
          <span>Heller Kopf · korrigiertes Kalzium</span>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 2) : '—'}</strong>
          <small>mmol/l</small>
        </div>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="calcium-shared">
        Mit dem Rechner oben verbunden: Werte und Einheiten ändern sich an beiden Eingabestellen
        gemeinsam. Auch die zwei Knöpfe steuern diese Werte.
      </p>
      <div className="calcium-working">
        <div>
          <span>01 · 40 − Albumin</span>
          <b>
            {pose ? formatNumber(40 - pose.albumin, 1) : '—'}
            <small> g/l</small>
          </b>
        </div>
        <div>
          <span>02 · × 0,02</span>
          <b>
            {pose ? `${pose.correction > 0 ? '+' : ''}${formatNumber(pose.correction, 2)}` : '—'}
            <small> mmol/l</small>
          </b>
        </div>
        <div>
          <span>03 · Kalzium + Versatz</span>
          <b>
            {pose ? formatNumber(pose.result, 2) : '—'}
            <small> mmol/l</small>
          </b>
        </div>
      </div>
      <div className="calcium-experiments">
        <p>Jeden Einfluss einzeln vergleichen:</p>
        <div>
          {[
            { calcium: '2,1', albumin: '30', label: '2,10 / 30 · Start · 2,30' },
            { calcium: '2,5', albumin: '30', label: 'Nur Kalzium → 2,50 · 2,70' },
            { calcium: '2,1', albumin: '20', label: 'Nur Albumin → 20 · 2,50' },
            { calcium: '2,1', albumin: '40', label: '40 g/l · kein Versatz' },
            { calcium: '2,1', albumin: '50', label: '50 g/l · Versatz −0,20' },
          ].map(({ label, ...values }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
        </div>
        <p>
          10 g/l weniger Albumin addieren 0,20 mmol/l; 10 g/l mehr ziehen 0,20 mmol/l ab. Bei
          gleichem Albumin verschiebt mehr Kalzium beide Schlitten um denselben Weg.
        </p>
      </div>
      <p className="calcium-note">
        Der Schlitten zeigt die konventionelle Rechenregel. Er misst kein ionisiertes Kalzium und
        bildet keine physiologische Reaktion ab. Die Grenzen der Albuminkorrektur stehen unter dem
        Rechner.
      </p>
    </section>
  );
}
