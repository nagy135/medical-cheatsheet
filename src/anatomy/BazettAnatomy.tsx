import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { BazettInstrument } from './BazettInstrument';
import { bazettCalculator, bazettInputs, bazettPose } from './bazett-model';
import './iso.css';
import './anatomy.css';
import './bazett.css';
export function BazettAnatomy({
  raw,
  onChange,
  onPreset,
}: {
  raw: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const evaluation = evaluateCalculator(bazettCalculator, raw),
    pose = evaluation.result === null ? null : bazettPose(evaluation.values);
  return (
    <section
      className="anatomy-panel bazett-panel"
      aria-labelledby="anatomy-title-bazett"
      data-anatomy="qtc-bazett"
      data-instrument="circular-slide-rule"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-bazett">Die Bazett-Scheibe</h2>
          <p>
            Ein QT-Intervall, zwei Richtungen: Grau steht für das gemessene QT, der helle Zeiger für
            QTc. Die Herzfrequenz bestimmt RR und dreht die innere Skala um den Korrekturfaktor
            1/√RR.
          </p>
        </div>
        <span className="anatomy-method">QTc · QT / √RR</span>
      </header>
      <BazettInstrument
        values={pose ? evaluation.values : null}
        onInput={(field, value) => onChange(field, String(value).replace('.', ','))}
      />
      <div className="bazett-controls">
        {bazettInputs.map((id) => {
          const field = bazettCalculator.fields.find((f) => f.id === id)!;
          return (
            <div className="bazett-input" key={id}>
              <label htmlFor={`anatomy-${id}`}>
                {id === 'heartRate'
                  ? 'Links · Herzfrequenz → RR-Scheibe'
                  : 'Rechts · QT → grauer Zeiger'}
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
                min="1"
                max={field.max}
                step="1"
                value={evaluation.values[id] ?? Number(field.example)}
                aria-label={`${field.label} an der Bazett-Scheibe einstellen`}
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
      <div className="bazett-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>QT × Korrekturfaktor</span>
          <code>
            {pose ? `${formatNumber(pose.qt, 0)} × ${formatNumber(pose.gain, 3)}` : 'QT × 1/√RR'}
          </code>
        </div>
        <div>
          <span>Heller Zeiger · QTc nach Bazett</span>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 0) : '—'}</strong>
          <small>ms</small>
        </div>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="bazett-shared">
        Mit dem Rechner oben verbunden: Beide Eingabestellen und die zwei Knöpfe verändern dieselben
        Werte.
      </p>
      <div className="bazett-working">
        <div>
          <span>01 · RR = 60 / Herzfrequenz</span>
          <b>
            {pose ? formatNumber(pose.rr, 3) : '—'} <small>s</small>
          </b>
        </div>
        <div>
          <span>02 · √RR</span>
          <b>{pose ? formatNumber(pose.root, 3) : '—'}</b>
        </div>
        <div>
          <span>03 · Faktor 1/√RR</span>
          <b>{pose ? formatNumber(pose.gain, 3) : '—'}</b>
        </div>
      </div>
      <div className="bazett-experiments">
        <p>QT und Herzfrequenz getrennt vergleichen:</p>
        <div>
          {[
            { qt: '400', heartRate: '75', label: '400 ms / 75 · Start' },
            { qt: '500', heartRate: '75', label: 'Nur QT → 500 ms · QTc 559' },
            { qt: '400', heartRate: '120', label: 'Nur Frequenz → 120 · QTc 566' },
            { qt: '400', heartRate: '60', label: '60/min · QTc = QT' },
            { qt: '400', heartRate: '30', label: '30/min · QTc 283' },
          ].map(({ label, ...values }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
        </div>
        <p>
          Bei 60/min ist RR = 1 s: Beide Zeiger zeigen in dieselbe Richtung. Von 60 auf 120/min
          steigt QTc bei gleichem QT um den Faktor √2.
        </p>
      </div>
      <p className="bazett-note">
        Die Scheibe zeigt die Rechenregel, keinen gemessenen Herzschlag und keine EKG-Kurve. Eine
        Drehung addiert Winkel; auf einer logarithmischen Skala entspricht das einer Multiplikation.
        Die klinischen Grenzen der Bazett-Korrektur stehen unter dem Rechner.
      </p>
    </section>
  );
}
