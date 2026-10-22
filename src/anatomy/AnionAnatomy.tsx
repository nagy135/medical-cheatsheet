import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { AnionInstrument } from './AnionInstrument';
import { anionCalculator, anionInputs, anionPose } from './anion-model';
import './iso.css';
import './anatomy.css';
import './anion.css';
export function AnionAnatomy({
  raw,
  onChange,
  onPreset,
}: {
  raw: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const evaluation = evaluateCalculator(anionCalculator, raw),
    pose = evaluation.result === null ? null : anionPose(evaluation.values);
  const labels = {
    sodium: 'Links · Natrium Na⁺',
    chloride: 'Rechts unten · Chlorid Cl⁻',
    bicarbonate: 'Rechts oben · Bikarbonat HCO₃⁻',
  };
  return (
    <section
      className="anatomy-panel anion-panel"
      aria-labelledby="anatomy-title-anion"
      data-anatomy="anionenluecke"
      data-instrument="charge-cabinet"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-anion">Der Bilanzschrank</h2>
          <p>
            Was bleibt von Natrium übrig, wenn Chlorid und Bikarbonat abgezogen werden? Links füllt
            Na⁺ ein Fach, rechts werden Cl⁻ und HCO₃⁻ gestapelt. Der Unterschied ihrer oberen Kanten
            ist die Anionenlücke.
          </p>
        </div>
        <span className="anatomy-method">AG · Na − Cl − HCO₃</span>
      </header>
      <div className="anion-workbench">
        <AnionInstrument
          values={pose ? evaluation.values : null}
          onInput={(field, value) => onChange(field, String(value).replace('.', ','))}
        />
        <aside className="anion-controls" aria-label="Werte für den Bilanzschrank">
          {anionInputs.map((id) => {
            const field = anionCalculator.fields.find((f) => f.id === id)!;
            return (
              <div className="anion-input" key={id}>
                <label htmlFor={`anatomy-${id}`}>{labels[id]}</label>
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
                  min="1"
                  max={pose?.controlMax ?? 200}
                  step="1"
                  value={evaluation.values[id] ?? Number(field.example)}
                  aria-label={`${field.label} am Bilanzschrank einstellen`}
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
          <div className="anion-answer" aria-live="polite" aria-atomic="true">
            <span>Anionenlücke · ohne Kalium</span>
            <div>
              <strong data-anatomy-result>{pose ? formatNumber(pose.result, 1) : '—'}</strong>
              <small>mmol/l</small>
            </div>
            <p data-anion-state>
              {!pose
                ? 'Bitte alle drei Werte eingeben.'
                : pose.sign > 0
                  ? 'Na liegt über Cl + HCO₃.'
                  : pose.sign < 0
                    ? 'Cl + HCO₃ liegt über Na: negatives Ergebnis.'
                    : 'Bündige Kanten: Die Differenz ist null.'}
            </p>
          </div>
        </aside>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="anion-shared">
        Ein Satz Eingaben: Rechner, Zahlenfelder und Knöpfe am Schrank bleiben synchron.
      </p>
      <div className="anion-working">
        <div>
          <span>01 · Natrium</span>
          <b>{pose ? formatNumber(pose.sodium, 1) : '—'}</b>
        </div>
        <div>
          <span>02 · Chlorid + Bikarbonat</span>
          <b>{pose && pose.measured !== null ? formatNumber(pose.measured, 1) : 'Cl + HCO₃'}</b>
        </div>
        <div>
          <span>03 · Na − Cl − HCO₃</span>
          <b>{pose ? formatNumber(pose.result, 1) : '—'}</b>
        </div>
      </div>
      <div className="anion-experiments">
        <p>Jeden Einfluss einzeln ausprobieren:</p>
        <div>
          {[
            { sodium: '140', chloride: '104', bicarbonate: '24', label: '140 / 104 / 24 · Start' },
            { sodium: '150', chloride: '104', bicarbonate: '24', label: 'Nur Na +10 · AG 22' },
            { sodium: '140', chloride: '114', bicarbonate: '24', label: 'Nur Cl +10 · AG 2' },
            { sodium: '140', chloride: '104', bicarbonate: '34', label: 'Nur HCO₃ +10 · AG 2' },
            { sodium: '128', chloride: '104', bicarbonate: '24', label: 'Bündig · AG 0' },
            { sodium: '120', chloride: '104', bicarbonate: '24', label: 'Umgekehrt · AG −8' },
          ].map(({ label, ...values }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
        </div>
        <p>Na +10 erhöht AG um 10. Cl +10 oder HCO₃ +10 senkt AG um 10.</p>
      </div>
      <p className="anion-note">
        Der Schrank vergleicht Zahlenwerte; der freie Höhenunterschied ist eine Rechendifferenz,
        keine tatsächliche elektrische Ladungslücke. Alle drei Werte nutzen denselben
        Zeichenmaßstab, der bei großen Eingaben erweitert wird. Ohne Kalium und ohne
        Albuminkorrektur; keine Markierung eines klinischen Referenzbereichs.
      </p>
    </section>
  );
}
