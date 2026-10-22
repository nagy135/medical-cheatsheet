import { evaluateCalculator, formatNumber, parseGermanNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { HorovitzInstrument } from './HorovitzInstrument';
import { horovitzCalculator, horovitzInputs, horovitzPose, horovitzRaw } from './horovitz-model';
import './iso.css';
import './anatomy.css';
import './horovitz.css';
export function HorovitzAnatomy({
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
  const evaluation = evaluateCalculator(horovitzCalculator, raw, units),
    pose = evaluation.result === null ? null : horovitzPose(evaluation.values);
  const steps = Object.fromEntries(
    horovitzCalculator.fields.map((f) => [
      f.id,
      numericFieldSettings(f, units[f.id] ?? 0).step * (f.units?.[units[f.id] ?? 0].factor ?? 1),
    ]),
  );
  return (
    <section
      className="anatomy-panel horovitz-panel"
      aria-labelledby="anatomy-title-horovitz"
      data-anatomy="horovitz"
      data-instrument="oxygen-normalization-bench"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-horovitz">Die O₂-Normierbank</h2>
          <p>
            Links stellt der Schieber den Sauerstoffanteil FiO₂ ein. Rechts wird PaO₂ durch diesen
            Anteil geteilt: Die helle P/F-Säule zeigt das Ergebnis auf derselben Druckskala.
          </p>
        </div>
        <span className="anatomy-method">P/F · PaO₂ / FiO₂</span>
      </header>
      <HorovitzInstrument
        values={pose ? evaluation.values : null}
        steps={steps}
        onInput={(field, value) => onChange(field, horovitzRaw(field, value, units))}
      />
      <div className="horovitz-controls">
        {horovitzInputs.map((id) => {
          const field = horovitzCalculator.fields.find((f) => f.id === id)!,
            index = units[id] ?? 0,
            settings = numericFieldSettings(field, index),
            factor = field.units![index].factor;
          return (
            <div className="horovitz-input" key={id}>
              <label htmlFor={`anatomy-${id}`}>
                {id === 'fio2'
                  ? 'Links · FiO₂ → Sauerstoffanteil'
                  : 'Rechts · PaO₂ → graue Drucksäule'}
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
                min={id === 'fio2' ? settings.min : settings.step}
                max={settings.max ?? Math.max(400, evaluation.values[id] ?? 400) / factor}
                step={settings.step}
                value={parseGermanNumber(raw[id] ?? '') ?? Number(field.example) / factor}
                aria-label={`${field.label} an der Normierbank einstellen`}
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
      <div className="horovitz-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>PaO₂ / Sauerstoffanteil</span>
          <code>
            {pose
              ? `${formatNumber(pose.pao2, 1)} / ${formatNumber(pose.fraction, 2)}`
              : 'PaO₂ / FiO₂'}
          </code>
        </div>
        <div>
          <span>Helle Säule · Horovitz-Index</span>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 0) : '—'}</strong>
          <small>mmHg</small>
        </div>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="horovitz-shared">
        Mit dem Rechner oben verbunden: Werte und Einheiten ändern sich an beiden Eingabestellen
        gemeinsam. Auch die zwei Knöpfe steuern diese Werte.
      </p>
      <div className="horovitz-working">
        <div>
          <span>01 · FiO₂ / 100</span>
          <b>{pose ? formatNumber(pose.fraction, 2) : '—'}</b>
        </div>
        <div>
          <span>02 · Faktor 1 / FiO₂</span>
          <b>
            {pose ? formatNumber(pose.gain, 3) : '—'}
            <small> ×</small>
          </b>
        </div>
        <div>
          <span>03 · Gemeinsame Skala</span>
          <b>
            0–{pose ? formatNumber(pose.scale, 0) : '—'}
            <small> mmHg</small>
          </b>
        </div>
      </div>
      <div className="horovitz-experiments">
        <p>Jeden Einfluss einzeln vergleichen:</p>
        <div>
          {[
            { pao2: '80', fio2: '40', label: '80 / 40 % · Start · P/F 200' },
            { pao2: '120', fio2: '40', label: 'Nur PaO₂ → 120 · P/F 300' },
            { pao2: '80', fio2: '80', label: 'Nur FiO₂ → 80 % · P/F 100' },
            { pao2: '80', fio2: '100', label: '100 % O₂ · beide Säulen gleich' },
            { pao2: '80', fio2: '21', label: '21 % O₂ · P/F 381' },
            { pao2: '160', fio2: '80', label: 'Beide verdoppelt · P/F bleibt 200' },
          ].map(({ label, ...values }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
        </div>
        <p>
          Doppelter PaO₂ verdoppelt den Index; doppelter Sauerstoffanteil halbiert ihn. Verdoppelt
          man beides, bleibt der Quotient gleich.
        </p>
      </div>
      <p className="horovitz-note">
        Die Bank zeigt eine rechnerische Normierung, keine Vorhersage des PaO₂ bei anderer
        Sauerstoffzufuhr. PaO₂ und FiO₂ bleiben unabhängige Eingaben. Das Fenster stellt Anteile
        dar, keine getrennten Gasschichten. Die klinische Einordnung steht unter dem Rechner.
      </p>
    </section>
  );
}
