import { useState } from 'react';
import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { BsaInstrument } from './BsaInstrument';
import { bsaCalculator, bsaPose } from './bsa-model';
import './iso.css';
import './anatomy.css';
import './bsa.css';

export function BsaAnatomy({
  raw,
  onChange,
  onPreset,
}: {
  raw: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const [form, setForm] = useState(0);
  const evaluation = evaluateCalculator(bsaCalculator, raw);
  const pose = evaluation.result === null ? null : bsaPose(evaluation.values, form);
  return (
    <section
      className="anatomy-panel bsa-panel"
      aria-labelledby="anatomy-title-bsa"
      data-anatomy="koerperoberflaeche"
      data-instrument="root-aperture"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-bsa">Das Wurzelfenster</h2>
          <p>
            Warum steht eine Wurzel in der Mosteller-Formel? Größe und Gewicht spannen hier ein
            Rechteck auf. Forme es zu einem gleich großen Quadrat: Die Seitenlänge liefert den
            Zahlenwert der Körperoberfläche.
          </p>
        </div>
        <span className="anatomy-method">KOF · √A</span>
      </header>
      <div className="bsa-workbench">
        <div className="bsa-visual">
          <BsaInstrument
            values={pose ? evaluation.values : null}
            form={form}
            onInput={(field, value) => onChange(field, String(value).replace('.', ','))}
          />
          <div className="bsa-form-control">
            <label htmlFor="bsa-form">
              Vom Rechteck zum Quadrat <span>{Math.round(form * 100)} %</span>
            </label>
            <input
              id="bsa-form"
              type="range"
              className="anatomy-range"
              min="0"
              max="1"
              step="0.01"
              value={form}
              onChange={(e) => setForm(Number(e.target.value))}
            />
            <div>
              <button aria-pressed={form === 0} onClick={() => setForm(0)}>
                Rechteck
              </button>
              <button aria-pressed={form === 1} onClick={() => setForm(1)}>
                Gleich großes Quadrat
              </button>
            </div>
            <p>Nur die Form ändert sich. Rechenfläche und KOF bleiben gleich.</p>
          </div>
        </div>
        <aside className="bsa-controls" aria-label="Werte für das Wurzelfenster">
          <p className="bsa-shared">
            Mit dem Rechner oben verbunden: Beide Eingabestellen verändern dieselben Werte.
          </p>
          {(['height', 'weight'] as const).map((id) => {
            const field = bsaCalculator.fields.find((f) => f.id === id)!;
            return (
              <div className="bsa-input" key={id}>
                <label htmlFor={`anatomy-${id}`}>
                  {id === 'height'
                    ? '01 · Körpergröße → Rechteckbreite'
                    : '02 · Gewicht → Rechteckhöhe'}
                </label>
                <NumericInput
                  field={field}
                  idPrefix="anatomy"
                  value={raw[id] ?? ''}
                  unitIndex={0}
                  error={evaluation.errors[id]}
                  onChange={(value) => onChange(id, value)}
                  onUnitChange={() => {}}
                />
                <input
                  type="range"
                  className="anatomy-range"
                  min={id === 'height' ? 100 : 1}
                  max={field.max}
                  step="1"
                  value={evaluation.values[id] ?? (id === 'height' ? 175 : 75)}
                  aria-label={`${field.label} am Wurzelfenster einstellen`}
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
          <div className="bsa-answer" aria-live="polite" aria-atomic="true">
            <span>Quadratseite → Körperoberfläche</span>
            <div>
              <strong data-anatomy-result>{pose ? formatNumber(pose.result, 2) : '—'}</strong>
              <small>m²</small>
            </div>
            <code>
              {pose
                ? `√${formatNumber(pose.area, 3)} = ${formatNumber(pose.result, 2)}`
                : '√(Größe × Gewicht / 3600)'}
            </code>
          </div>
        </aside>
      </div>
      {evaluation.formError && (
        <p role="alert" className="anatomy-error">
          {evaluation.formError}
        </p>
      )}
      <div className="bsa-working">
        <div>
          <span>01 · Hilfsseiten</span>
          <strong>
            {pose ? `${formatNumber(pose.a, 3)} × ${formatNumber(pose.b, 3)}` : '— × —'}
          </strong>
          <p>Größe in cm / 60 und Gewicht in kg / 60</p>
        </div>
        <div>
          <span>02 · Rechenfläche A</span>
          <strong>{pose ? formatNumber(pose.area, 3) : '—'}</strong>
          <p>Größe × Gewicht / 3600</p>
        </div>
        <div>
          <span>03 · Quadratseite s</span>
          <strong>{pose ? formatNumber(pose.result, 2) : '—'}</strong>
          <p>s × s = A · also s = √A</p>
        </div>
      </div>
      <div className="bsa-experiments">
        <p>Beide Einflüsse einzeln ausprobieren:</p>
        <div>
          {[
            { height: '175', weight: '75', label: '175 cm / 75 kg · Start' },
            { height: '200', weight: '75', label: 'Nur Größe → 200 cm' },
            { height: '175', weight: '100', label: 'Nur Gewicht → 100 kg' },
          ].map(({ label, ...values }) => (
            <button
              key={label}
              onClick={() => {
                onPreset(values);
                setForm(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p>175 cm / 75 kg → 1,91 m² · 200 cm / 75 kg → 2,04 m² · 175 cm / 100 kg → 2,20 m²</p>
      </div>
      <p className="bsa-note">
        Die Hilfsseiten und die Rechenfläche sind dimensionslose Zahlen. Das Fenster zeigt den
        Rechenweg, keine Körperkontur oder tatsächliche Hautfläche. Das Ergebnis erhält gemäß
        Mosteller die Einheit m².
      </p>
    </section>
  );
}
