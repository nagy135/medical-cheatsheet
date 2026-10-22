import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { MapInstrument } from './MapInstrument';
import { mapCalculator, mapPose } from './map-model';
import './iso.css';
import './anatomy.css';
import './map.css';

export function MapAnatomy({
  raw,
  onChange,
  onPreset,
}: {
  raw: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const evaluation = evaluateCalculator(mapCalculator, raw);
  const pose = evaluation.result === null ? null : mapPose(evaluation.values);
  const input = (id: 'systolic' | 'diastolic') => {
    const field = mapCalculator.fields.find((f) => f.id === id)!;
    return (
      <div className="map-input">
        <label htmlFor={`anatomy-${id}`}>
          {id === 'diastolic' ? 'Links · Diastolischer Druck' : 'Rechts · Systolischer Druck'}
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
          min="0"
          max={pose?.scale ?? 240}
          step="1"
          value={evaluation.values[id] ?? 0}
          aria-label={`${field.label} an der Drittel-Brücke einstellen`}
          onChange={(event) => onChange(id, String(Math.max(0.000001, Number(event.target.value))))}
        />
        {evaluation.errors[id] && (
          <span className="field-error" id={`anatomy-error-${id}`}>
            {evaluation.errors[id]}
          </span>
        )}
      </div>
    );
  };
  return (
    <section
      className="anatomy-panel map-panel"
      aria-labelledby="anatomy-title-map"
      data-anatomy="map"
      data-instrument="third-bridge"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-map">Die Drittel-Brücke</h2>
          <p>
            Zwei Druckwerte heben die Enden einer Geraden. Der helle Abnehmer liegt näher am
            diastolischen Ende: Er liest D + ⅓ × (S − D). Deshalb zählt eine Änderung von D doppelt
            so stark wie die gleiche Änderung von S.
          </p>
        </div>
        <span className="anatomy-method">MAD · 1 : 2</span>
      </header>
      <p className="map-shared">
        Ein Satz Eingaben: Änderungen hier und im Rechner oben wirken sofort auf dasselbe Ergebnis.
      </p>
      <MapInstrument
        values={pose ? evaluation.values : null}
        onInput={(field, value) => onChange(field, String(value).replace('.', ','))}
      />
      <div className="map-controls">
        {input('diastolic')}
        <div className="map-answer" aria-live="polite" aria-atomic="true">
          <span>Heller Abnehmer · MAD</span>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 1) : '—'}</strong>
          <small>mmHg</small>
        </div>
        {input('systolic')}
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <div className="map-working">
        <span>
          Pulsdruck S − D: <b>{pose ? formatNumber(pose.pulse, 1) : '—'} mmHg</b>
        </span>
        <span>
          Davon ein Drittel: <b>{pose ? formatNumber(pose.rise, 1) : '—'} mmHg</b>
        </span>
        <code>
          {pose
            ? `${formatNumber(pose.diastolic, 1)} + ${formatNumber(pose.rise, 1)} = ${formatNumber(pose.result, 1)} mmHg`
            : 'MAD ≈ D + (S − D) / 3'}
        </code>
      </div>
      <div className="map-experiments">
        <p>Von 120/80 aus vergleichen:</p>
        <div>
          {[
            { systolic: '120', diastolic: '80', label: '120/80 · Ausgangspunkt' },
            { systolic: '150', diastolic: '80', label: '150/80 · nur S +30' },
            { systolic: '120', diastolic: '110', label: '120/110 · nur D +30' },
          ].map(({ label, ...values }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
        </div>
        <p>S +30 hebt MAD um 10 mmHg. D +30 hebt MAD um 20 mmHg.</p>
      </div>
      <p className="map-note">
        Die Brücke veranschaulicht die Näherungsformel, keine gemessene Blutdruckkurve. Die
        klinischen Grenzen des Rechners gelten weiterhin.
      </p>
    </section>
  );
}
