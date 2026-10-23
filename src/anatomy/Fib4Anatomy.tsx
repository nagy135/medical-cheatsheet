import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { fib4Calculator, fib4Inputs, fib4Pose } from './fib4-model';
import { Fib4Instrument } from './Fib4Instrument';
import './iso.css';
import './anatomy.css';
import './fib4.css';
export type Fib4AnatomyProps = {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
};
const presets = [
  { label: 'Ausgangswert · 2,03', values: { age: '60', ast: '40', platelets: '200', alt: '35' } },
  { label: 'Nur Alter × 2 · 4,06', values: { age: '120', ast: '40', platelets: '200', alt: '35' } },
  { label: 'Nur AST × 2 · 4,06', values: { age: '60', ast: '80', platelets: '200', alt: '35' } },
  {
    label: 'Nur Thrombozyten × 2 · 1,01',
    values: { age: '60', ast: '40', platelets: '400', alt: '35' },
  },
  { label: 'Nur ALT × 4 · 1,01', values: { age: '60', ast: '40', platelets: '200', alt: '140' } },
];
export function Fib4Anatomy({ raw, units, onChange, onUnitChange, onPreset }: Fib4AnatomyProps) {
  const evaluation = evaluateCalculator(fib4Calculator, raw, units),
    pose = evaluation.result === null ? null : fib4Pose(evaluation.values);
  const steps = Object.fromEntries(
    fib4Calculator.fields.map((f) => [
      f.id,
      numericFieldSettings(f, units[f.id] ?? 0).step * (f.units?.[units[f.id] ?? 0]?.factor ?? 1),
    ]),
  );
  const fmt = (n: number, d = 2) => formatNumber(n, d);
  return (
    <section
      className="anatomy-panel fib4-panel"
      data-anatomy="fib4"
      data-instrument="shaped-cam-comparator"
      aria-labelledby="anatomy-title-fib4"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-fib4">Der Kurvenkomparator</h2>
          <p>
            Alter und AST vergrößern den Zähler. Thrombozyten und die Quadratwurzel von ALT
            vergrößern den Nenner. Die gekrümmte vierte Nocke zeigt, warum vierfaches ALT den Index
            nur halbiert.
          </p>
        </div>
        <span className="anatomy-method">Alter × AST / (Thr × √ALT)</span>
      </header>
      <Fib4Instrument
        values={pose ? evaluation.values : null}
        steps={steps}
        onInput={(id, n) => {
          const field = fib4Calculator.fields.find((f) => f.id === id)!,
            factor = field.units?.[units[id] ?? 0]?.factor ?? 1;
          onChange(
            id,
            (n / factor).toLocaleString('de-DE', { useGrouping: false, maximumFractionDigits: 12 }),
          );
        }}
      />
      <div className="fib4-controls">
        {fib4Inputs.map((id, i) => {
          const f = fib4Calculator.fields.find((f) => f.id === id)!;
          return (
            <div className="fib4-input" key={id}>
              <label htmlFor={`anatomy-${id}`}>
                <span>{['01 · linear', '02 · linear', '03 · linear', '04 · Wurzelkurve'][i]}</span>
                {f.label}
              </label>
              <NumericInput
                idPrefix="anatomy"
                field={f}
                value={raw[id] ?? ''}
                unitIndex={units[id] ?? 0}
                error={evaluation.errors[id]}
                onChange={(v) => onChange(id, v)}
                onUnitChange={(index) => onUnitChange(id, index)}
              />
              {evaluation.errors[id] ? (
                <span className="field-error" id={`anatomy-error-${id}`}>
                  {evaluation.errors[id]}
                </span>
              ) : f.hint ? (
                <span className="field-hint" id={`anatomy-hint-${id}`}>
                  {f.hint}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="fib4-calculation" aria-live="polite" aria-atomic="true">
        <div>
          <span>Zähler · breite Zunge links</span>
          <b>
            {pose
              ? `${fmt(pose.age, 0)} × ${fmt(pose.ast, 1)} = ${fmt(pose.numerator, 1)}`
              : 'Alter × AST'}
          </b>
        </div>
        <div>
          <span>Nenner · breite Zunge rechts</span>
          <b>
            {pose
              ? `${fmt(pose.platelets, 1)} × ${fmt(pose.rootALT, 3)} = ${fmt(pose.denominator, 2)}`
              : 'Thrombozyten × √ALT'}
          </b>
        </div>
        <div className="fib4-result">
          <span>FIB-4-Index · schmale Zunge</span>
          <strong data-anatomy-result>{pose ? fmt(pose.result) : '—'}</strong>
        </div>
      </div>
      <p className="fib4-scale">
        {pose
          ? `Bahnenden (Zeichenbereiche): ${fmt(pose.domains.age, 0)} Jahre · ${fmt(pose.domains.ast, 0)} U/l AST · ${fmt(pose.domains.platelets, 0)} G/l · ${fmt(pose.domains.alt, 0)} U/l ALT. Gemeinsame Zungenskala: 0–${fmt(76 / pose.registerUnit, 1)}. Quotientenskala: 0–${fmt(pose.quotientMax, 2)}.`
          : 'Die beweglichen Fühler und Zungen erscheinen erst bei vier gültigen Eingaben.'}{' '}
        Die Skalen erweitern sich bei Bedarf; sie sind keine klinischen Grenzwerte.
      </p>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <div className="fib4-experiments">
        <p>Einen Einfluss ändern, die anderen konstant halten:</p>
        <div>
          {presets.map((p) => (
            <button key={p.label} onClick={() => onPreset(p.values)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="fib4-note">
        Alle Eingaben und Eckknöpfe sind mit dem Rechner oben verbunden. Die Zungen werden
        rechnerisch gekoppelt; ihre Längen bilden das Verhältnis von Zähler zu Nenner ab. Das
        Instrument zeigt die Formel, keinen zeitlichen Krankheitsverlauf. {fib4Calculator.note}
      </p>
    </section>
  );
}
