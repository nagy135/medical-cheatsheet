import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { ShockInstrument } from './ShockInstrument';
import { shockCalculator, shockPose } from './shock-model';
import './iso.css';
import './anatomy.css';
import './shock.css';
export function ShockAnatomy({
  raw,
  onChange,
  onPreset,
}: {
  raw: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const evaluation = evaluateCalculator(shockCalculator, raw),
    pose = evaluation.result === null ? null : shockPose(evaluation.values);
  return (
    <section
      className="anatomy-panel shock-panel"
      aria-labelledby="anatomy-title-shock"
      data-anatomy="schockindex"
      data-instrument="ratio-balance"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-shock">Die Verhältniswaage</h2>
          <p>
            Ein Quotient braucht zwei Werte. Auf dieser Waage steht links die Herzfrequenz, rechts
            der systolische Druck. Ein verschiebbarer Stützpunkt gleicht ihre Hebelwirkungen aus und
            macht das Verhältnis sichtbar.
          </p>
        </div>
        <span className="anatomy-method">SI · H / P</span>
      </header>
      <div className="shock-legend">
        <span>Linkes Gewicht · Herzfrequenz H</span>
        <span>Rechtes Gewicht · systolischer Druck P</span>
      </div>
      <ShockInstrument
        values={pose ? evaluation.values : null}
        onInput={(field, value) => onChange(field, String(value).replace('.', ','))}
      />
      <div className="shock-controls">
        {(['heartRate', 'systolic'] as const).map((id) => {
          const field = shockCalculator.fields.find((f) => f.id === id)!;
          return (
            <div key={id} className="shock-input">
              <label htmlFor={`anatomy-${id}`}>
                {id === 'heartRate' ? 'Links · Herzfrequenz' : 'Rechts · Systolischer Blutdruck'}
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
                className="anatomy-range"
                type="range"
                min="1"
                max={Math.max(240, pose?.scale ?? 240)}
                step="1"
                value={evaluation.values[id] ?? (id === 'heartRate' ? 90 : 120)}
                aria-label={`${field.label} an der Verhältniswaage einstellen`}
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
      <div className="shock-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Herzfrequenz / systolischer Druck</span>
          <code>
            {pose
              ? `${formatNumber(pose.heartRate, 1)} / ${formatNumber(pose.systolic, 1)}`
              : 'H / P'}
          </code>
        </div>
        <div>
          <span>Schockindex</span>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 2) : '—'}</strong>
        </div>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="shock-shared">
        Mit dem Rechner oben verbunden: Beide Eingabestellen und die Gewichtsknöpfe ändern dieselben
        Werte.
      </p>
      <div className="shock-working">
        <div>
          <span>Linker Hebelarm a</span>
          <b>{pose ? formatNumber(pose.leftArm, 2) : '—'}</b>
        </div>
        <div>
          <span>Rechter Hebelarm b</span>
          <b>{pose ? formatNumber(pose.rightArm, 2) : '—'}</b>
        </div>
        <div>
          <span>b / a = H / P</span>
          <b>{pose ? formatNumber(pose.result, 2) : '—'}</b>
        </div>
      </div>
      <div className="shock-experiments">
        <p>Was verändert den Quotienten?</p>
        <div>
          {[
            { heartRate: '90', systolic: '120', label: '90 / 120 · Start' },
            { heartRate: '120', systolic: '120', label: 'Nur H → 120 · SI 1,00' },
            { heartRate: '90', systolic: '150', label: 'Nur P → 150 · SI 0,60' },
            { heartRate: '180', systolic: '240', label: 'Beide ×2 · SI bleibt 0,75' },
          ].map(({ label, ...values }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
        </div>
        <p>
          Mehr H erhöht den Index, mehr P senkt ihn. Beide ×2 lässt den Stützpunkt an derselben
          Stelle.
        </p>
      </div>
      <p className="shock-note">
        Idealisierte Waage mit masselosem Balken: Die Gewichte stellen Zahlenwerte dar, keine
        medizinischen Einheiten. Hebelarme sind Zeicheneinheiten. Beide Gewichte nutzen denselben
        Höhenmaßstab; bei größeren Zahlen wird er gemeinsam angepasst. Der Index allein
        diagnostiziert keinen Schock.
      </p>
    </section>
  );
}
