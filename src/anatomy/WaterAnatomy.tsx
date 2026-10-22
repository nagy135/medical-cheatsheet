import { useEffect, useRef, useState } from 'react';
import { evaluateCalculator, formatNumber, parseGermanNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { waterCalculator, waterInputs, waterPose } from './water-model';
import { WaterInstrument } from './WaterInstrument';
import './iso.css';
import './anatomy.css';
import './water.css';
const presets = [
  {
    values: { weight: '70', sodium: '170', bodyWaterFraction: '0,6' },
    label: '70 kg / Na 170 / 0,6 · 9,00 l',
  },
  {
    values: { weight: '80', sodium: '170', bodyWaterFraction: '0,6' },
    label: 'Nur Gewicht → 80 kg · 10,29 l',
  },
  {
    values: { weight: '70', sodium: '180', bodyWaterFraction: '0,6' },
    label: 'Nur Na → 180 · 12,00 l',
  },
  {
    values: { weight: '70', sodium: '170', bodyWaterFraction: '0,5' },
    label: 'Nur Faktor → 0,5 · 7,50 l',
  },
  {
    values: { weight: '70', sodium: '140', bodyWaterFraction: '0,6' },
    label: 'Na 140 · kein Defizit',
  },
];
export function WaterAnatomy({
  raw,
  onChange,
  onPreset,
}: {
  raw: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onPreset: (values: Record<string, string>) => void;
}) {
  const evaluation = evaluateCalculator(waterCalculator, raw),
    pose = evaluation.result === null ? null : waterPose(evaluation.values);
  const [tour, setTour] = useState(false),
    section = useRef<HTMLElement>(null),
    latestPreset = useRef(onPreset),
    tourExpected = useRef<Record<string, string> | null>(null);
  latestPreset.current = onPreset;
  useEffect(() => {
    if (!tour) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false,
      index = 0;
    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)!.isIntersecting;
    });
    observer.observe(section.current!.querySelector('.water-svg')!);
    const timer = setInterval(() => {
      if (visible && !document.hidden && !reduced.matches) {
        index = (index + 1) % presets.length;
        tourExpected.current = presets[index].values;
        latestPreset.current(presets[index].values);
      }
    }, 4000);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [tour]);
  useEffect(() => {
    if (
      tour &&
      tourExpected.current &&
      waterInputs.some((id) => raw[id] !== tourExpected.current![id])
    )
      setTour(false);
  }, [raw, tour]);
  const steps = Object.fromEntries(
    waterCalculator.fields.map((f) => [f.id, numericFieldSettings(f).step]),
  );
  return (
    <section
      ref={section}
      className="anatomy-panel water-panel"
      data-anatomy="wasserdefizit"
      data-instrument="dilution-chamber"
      aria-labelledby="anatomy-title-water"
      onPointerDown={(e) => {
        if (!(e.target as Element).closest('[data-water-tour]')) setTour(false);
      }}
      onFocusCapture={(e) => {
        if (!(e.target as Element).closest('[data-water-tour]')) setTour(false);
      }}
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-water">Die Verdünnungskammer</h2>
          <p>
            Gewicht × Körperwasserfaktor bestimmt das graue Volumen. Natrium bestimmt, um welchen
            Anteil es bis zum Rechenbezug 140 mmol/l erweitert werden müsste. Die helle Verlängerung
            ist das geschätzte freie Wasserdefizit.
          </p>
        </div>
        <span className="anatomy-method">TBW × (Na / 140 − 1)</span>
      </header>
      <WaterInstrument
        values={pose ? evaluation.values : null}
        steps={steps}
        onInput={(field, value) => onChange(field, String(value).replace('.', ','))}
      />
      <div className="water-controls">
        {waterInputs.map((id, i) => {
          const field = waterCalculator.fields.find((f) => f.id === id)!,
            settings = numericFieldSettings(field);
          return (
            <div className="water-input" key={id}>
              <label htmlFor={`anatomy-${id}`}>
                {
                  [
                    'Links · Körpergewicht',
                    'Mitte · aktuelles Natrium',
                    'Rechts · Körperwasserfaktor',
                  ][i]
                }
              </label>
              <NumericInput
                idPrefix="anatomy"
                field={field}
                value={raw[id] ?? ''}
                unitIndex={0}
                error={evaluation.errors[id]}
                onChange={(v) => onChange(id, v)}
                onUnitChange={() => {}}
              />
              <input
                className="anatomy-range"
                type="range"
                min={id === 'sodium' ? 140 : settings.step}
                max={settings.max ?? Math.max(200, evaluation.values[id] ?? 200)}
                step={settings.step}
                value={parseGermanNumber(raw[id] ?? '') ?? parseGermanNumber(field.example) ?? 0}
                aria-label={`${field.label} an der Verdünnungskammer einstellen`}
                onChange={(e) => onChange(id, e.target.value)}
              />
              {evaluation.errors[id] && (
                <span className="field-error" id={`anatomy-error-${id}`}>
                  {evaluation.errors[id]}
                </span>
              )}
              {field.hint && !evaluation.errors[id] && (
                <span className="field-hint" id={`anatomy-hint-${id}`}>
                  {field.hint}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="water-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Geschätztes Körperwasser × Zusatzanteil</span>
          <code>
            {pose
              ? `${formatNumber(pose.tbw, 1)} × ${formatNumber(pose.ratio - 1, 3)}`
              : 'TBW × (Na / 140 − 1)'}
          </code>
        </div>
        <div>
          <span>Heller Volumeneinsatz · freies Wasserdefizit</span>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 2) : '—'}</strong>
          <small>l</small>
        </div>
      </div>
      {evaluation.formError && (
        <p role="alert" className="anatomy-error">
          {evaluation.formError}
        </p>
      )}
      <p className="water-shared">
        Mit dem Rechner oben verbunden: Alle drei Eingaben, Regler und Knöpfe verändern dieselben
        Werte.
      </p>
      <div className="water-working">
        <div>
          <span>01 · Gewicht × Faktor</span>
          <b>
            {pose ? formatNumber(pose.tbw, 1) : '—'}
            <small> l TBW</small>
          </b>
        </div>
        <div>
          <span>02 · Na / 140</span>
          <b>
            {pose ? formatNumber(pose.ratio, 3) : '—'}
            <small> ×</small>
          </b>
        </div>
        <div>
          <span>03 · TBW + Defizit</span>
          <b>
            {pose ? formatNumber(pose.total, 1) : '—'}
            <small> l</small>
          </b>
        </div>
      </div>
      <div className="water-experiments">
        <p>Jeden Einfluss einzeln vergleichen:</p>
        <div>
          {presets.map(({ values, label }) => (
            <button key={label} onClick={() => onPreset(values)}>
              {label}
            </button>
          ))}
          <button
            data-water-tour
            aria-pressed={tour}
            onClick={() => {
              if (!tour) {
                tourExpected.current = presets[0].values;
                onPreset(presets[0].values);
              }
              setTour((v) => !v);
            }}
          >
            {tour ? 'Automatischen Vergleich stoppen' : 'Beispiele automatisch vergleichen'}
          </button>
        </div>
        <p>
          Mehr Gewicht oder ein höherer Körperwasserfaktor vergrößert bei gleichem Natrium beide
          Volumina. Höheres Natrium vergrößert bei gleichem TBW nur die Verlängerung.
        </p>
      </div>
      <p className="water-note">
        Die Einsätze veranschaulichen Rechenvolumina, keine getrennten Körperräume. Das Modell hält
        Na × TBW konstant: 140 × (TBW + Defizit) ergibt denselben Zahlenwert. Es zeigt keinen
        zeitlichen Natriumverlauf und keine Infusionsmenge. Die klinischen Grenzen stehen unter dem
        Rechner.
      </p>
    </section>
  );
}
