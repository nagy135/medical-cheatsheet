import { useEffect, useRef } from 'react';
import { formatNumber, parseGermanNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import {
  evaluateOsmolality,
  osmolalityCalculator,
  osmolalityInputs,
  osmolalityPose,
} from './osmolality-model';
import { osmolalityInserts, osmolalityPoint, osmolalitySolid } from './osmolality-solid';
import { useTouchLock } from './touch';
import type { Values } from '../calculators';
import art from './osmolality-art.json';
import './iso.css';
import './anatomy.css';
import './osmolality.css';
export type OsmolalityAnatomyProps = {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
};
const presets = [
  { label: 'Ausgangswerte', values: { sodium: '140', glucose: '100', urea: '5' } },
  { label: 'Nur Natrium → 150', values: { sodium: '150', glucose: '100', urea: '5' } },
  {
    label: 'Nur Glukose → 360,364 mg/dl',
    values: { sodium: '140', glucose: '360,364', urea: '5' },
  },
  { label: 'Nur Harnstoff → 20 mmol/l', values: { sodium: '140', glucose: '100', urea: '20' } },
];
const numberString = (n: number) =>
  Number(n.toPrecision(12)).toLocaleString('de-DE', {
    useGrouping: false,
    maximumFractionDigits: 12,
  });
const say = (p: NonNullable<ReturnType<typeof osmolalityPose>>) =>
  `${formatNumber(p.contributions[0], 2)} + ${formatNumber(p.contributions[1], 2)} + ${formatNumber(p.contributions[2], 2)} ≈ ${formatNumber(p.result, 1)} mOsm/kg`;
function OsmolalityInstrument({
  values,
  ...props
}: OsmolalityAnatomyProps & { values: Values | null }) {
  const svgRef = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null),
    scale = useRef<HTMLSpanElement>(null);
  const latest = useRef({ values, ...props });
  latest.current = { values, ...props };
  const wake = useRef(() => {}),
    drag = useRef<{ field: string; start: number; value: number; unit: number } | null>(null);
  useTouchLock(svgRef, '.osmolality-handle');
  const pose = values ? osmolalityPose(values) : null;
  // These text nodes belong to the animation loop after mount, so a parent render
  // cannot put a target readout beside geometry that is still easing towards it.
  const initialText = useRef({
    readout: pose ? say(pose) : 'Bitte alle drei Werte gültig eingeben.',
    scale: pose
      ? `${formatNumber(252 / pose.unit, 1)} Recheneinheiten über die volle Rinne`
      : 'Gemeinsame Skala nach gültiger Eingabe',
  });
  useEffect(() => {
    const svg = svgRef.current!,
      groups = Object.fromEntries(
        osmolalityInserts(osmolalityPose({ sodium: 140, glucose: 100, urea: 5 })!).map((b) => [
          b.name,
          svg.querySelector<SVGGElement>(`[data-osmolality-group=${b.name}]`)!,
        ]),
      );
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current: Values | null = null,
      visible = false,
      frame = 0,
      last = 0;
    const run = () => {
      if (visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
    };
    function tick(now: number) {
      frame = 0;
      if (!visible || document.hidden) {
        last = 0;
        return;
      }
      const target = latest.current.values;
      if (!target) {
        current = null;
        last = 0;
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const id of osmolalityInputs) {
        const next = reduced.matches
          ? target[id]
          : current[id] + (target[id] - current[id]) * (1 - Math.exp(-dt / 0.16));
        current[id] =
          Math.abs(next - target[id]) < Math.max(1e-10, Math.abs(target[id]) * 1e-10)
            ? target[id]
            : next;
        moving ||= current[id] !== target[id];
      }
      const p = osmolalityPose(current);
      if (!p) return;
      for (const b of osmolalityInserts(p)) groups[b.name].innerHTML = osmolalitySolid(art, b);
      Object.assign(svg.dataset, {
        osmolalityResult: String(p.result),
        osmolalitySodium: String(current.sodium),
        osmolalityGlucose: String(current.glucose),
        osmolalityUrea: String(current.urea),
        osmolalityUnit: String(p.unit),
        osmolalityHeights: JSON.stringify(p.heights),
        osmolalityLengths: JSON.stringify(p.lengths),
      });
      if (readout.current) readout.current.textContent = say(p);
      if (scale.current)
        scale.current.textContent = `${formatNumber(252 / p.unit, 1)} Recheneinheiten über die volle Rinne`;
      if (moving) run();
    }
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.at(-1)!.isIntersecting;
        if (!visible) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        last = 0;
        run();
      },
      { rootMargin: '0px' },
    );
    observer.observe(svg);
    const resume = () => {
      last = 0;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else run();
    };
    const resize = () => {
      const r = (22 * art.width) / svg.getBoundingClientRect().width;
      svg.querySelectorAll<SVGRectElement>('[data-osmolality-hit]').forEach((rect, i) => {
        const p = osmolalityPoint(art, [-95, 10, 110][i], 74, 13.5);
        for (const [key, n] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: r * 2,
          height: r * 2,
        }))
          rect.setAttribute(key, String(n));
      });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(svg);
    resize();
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    wake.current = () => {
      if (!latest.current.values) {
        current = null;
        last = 0;
        for (const key of Object.keys(svg.dataset))
          if (key.startsWith('osmolality')) delete svg.dataset[key];
        if (readout.current) readout.current.textContent = 'Bitte alle drei Werte gültig eingeben.';
        if (scale.current) scale.current.textContent = 'Gemeinsame Skala nach gültiger Eingabe';
      }
      run();
    };
    return () => {
      observer.disconnect();
      ro.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      wake.current = () => {};
    };
  }, []);
  useEffect(() => wake.current(), [values]);
  const change = (id: string, n: number) => {
    const field = osmolalityCalculator.fields.find((f) => f.id === id)!,
      index = latest.current.units[id] ?? 0,
      { min, max } = numericFieldSettings(field, index);
    if (Number.isFinite(n))
      latest.current.onChange(
        id,
        numberString(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))),
      );
  };
  return (
    <figure className="osmolality-figure iso" data-theme="light">
      <div className="iso-plate osmolality-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 12 · Additive Dosierbank</span>
          <span>Vier Dosen · eine Summe</span>
        </div>
        <svg
          ref={svgRef}
          className="iso-svg osmolality-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Dosierbank mit zwei gleichen Natriumtrichtern, einem Glukose- und einem Harnstofftrichter. Die Rechenmengen ergeben zusammen den Inhalt der vorderen Messrinne."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-osmolality-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {osmolalityCalculator.fields.map((field, i) => {
            const unit = props.units[field.id] ?? 0,
              settings = numericFieldSettings(field, unit),
              value = parseGermanNumber(props.raw[field.id] ?? ''),
              label = field.units?.[unit]?.label ?? field.unit;
            const p = osmolalityPoint(art, [-95, 10, 110][i], 74, 13.5);
            return (
              <g
                key={field.id}
                className="osmolality-handle"
                data-field={field.id}
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-disabled={!pose}
                aria-label={`${field.label} an der Dosierbank ändern`}
                aria-valuemin={settings.min}
                aria-valuemax={settings.max}
                aria-valuenow={value ?? undefined}
                aria-valuetext={
                  pose
                    ? `${formatNumber(value!, 3)} ${label}; Beitrag ${formatNumber(pose.contributions[i], 2)} Recheneinheiten${i === 0 ? ' aus zwei gleichen Dosen' : ''}`
                    : 'Bitte alle Eingaben ausfüllen'
                }
                aria-orientation="vertical"
                onKeyDown={(e) => {
                  if (!pose) return;
                  const direction = ['ArrowUp', 'ArrowRight', 'PageUp'].includes(e.key)
                    ? 1
                    : ['ArrowDown', 'ArrowLeft', 'PageDown'].includes(e.key)
                      ? -1
                      : 0;
                  if (direction) {
                    e.preventDefault();
                    change(
                      field.id,
                      value! + direction * settings.step * (e.key.startsWith('Page') ? 10 : 1),
                    );
                  } else if (e.key === 'Home' && settings.min !== undefined) {
                    e.preventDefault();
                    change(field.id, Math.ceil(settings.min / settings.step) * settings.step);
                  }
                }}
                onPointerDown={(e) => {
                  if (!pose || e.button !== 0) return;
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = { field: field.id, start: e.clientY, value: value!, unit };
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (
                    !d ||
                    d.field !== field.id ||
                    d.unit !== (latest.current.units[field.id] ?? 0)
                  )
                    return;
                  const step = numericFieldSettings(field, d.unit).step;
                  change(field.id, d.value + Math.round((d.start - e.clientY) / 4) * step);
                }}
                onPointerUp={(e) => {
                  drag.current = null;
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    e.currentTarget.releasePointerCapture(e.pointerId);
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
                onLostPointerCapture={() => {
                  drag.current = null;
                }}
              >
                <title>{field.label}: ziehen oder Pfeiltasten verwenden</title>
                <rect
                  data-osmolality-hit
                  x={p[0] - 22}
                  y={p[1] - 22}
                  width={44}
                  height={44}
                  rx={8}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
        <div className="osmolality-figure-footer">
          <span>Drehknöpfe ziehen ↕ / Pfeiltasten</span>
          <span ref={readout} data-readout>
            {initialText.current.readout}
          </span>
        </div>
      </div>
      <figcaption>
        <span ref={scale}>{initialText.current.scale}</span>. Offene Vorderseiten zeigen die
        Füllungen. Gleiche Mengen haben gleiche Volumina; die Trichterhöhe folgt ihrer sich
        verbreiternden Form.
      </figcaption>
    </figure>
  );
}
export function OsmolalityAnatomy(props: OsmolalityAnatomyProps) {
  const { evaluation, pose } = evaluateOsmolality(props.raw, props.units);
  return (
    <section
      className="anatomy-panel osmolality-panel"
      data-anatomy="osmolalitaet"
      data-instrument="additive-dosing-hoppers"
      aria-labelledby="anatomy-title-osmolality"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-osmolality">Vier Dosen, eine Summe</h2>
          <p>
            Zwei gleiche Trichter für Natrium, je einer für Glukose und Harnstoff. Ihre Rechenmengen
            füllen gemeinsam die vordere Messrinne. So wird aus drei Konzentrationen eine geschätzte
            Serumosmolalität.
          </p>
        </div>
        <span className="anatomy-method">2 × Na + Glukose + Harnstoff</span>
      </header>
      <OsmolalityInstrument {...props} values={pose ? evaluation.values : null} />
      <div className="osmolality-contributions">
        {osmolalityCalculator.fields.map((field, i) => (
          <div key={field.id}>
            <span>
              {
                ['01 + 02 · Natrium doppelt', '03 · Glukose in mmol/l', '04 · Harnstoff in mmol/l'][
                  i
                ]
              }
            </span>
            <strong>{pose ? formatNumber(pose.contributions[i], 2) : '—'}</strong>
            <small>{['2 × Na', 'mg/dl ÷ 18,0182', 'mg/dl ÷ 6,006'][i]}</small>
          </div>
        ))}
      </div>
      <div className="osmolality-controls">
        {osmolalityCalculator.fields.map((field, i) => (
          <div key={field.id} className="osmolality-input">
            <label htmlFor={`anatomy-${field.id}`}>
              {['Links · Natrium (zwei Dosen)', 'Mitte · Glukose', 'Rechts · Harnstoff'][i]}
            </label>
            <NumericInput
              idPrefix="anatomy"
              field={field}
              value={props.raw[field.id] ?? ''}
              unitIndex={props.units[field.id] ?? 0}
              error={evaluation.errors[field.id]}
              onChange={(v) => props.onChange(field.id, v)}
              onUnitChange={(index) => props.onUnitChange(field.id, index)}
            />
            {evaluation.errors[field.id] ? (
              <span className="field-error" id={`anatomy-error-${field.id}`}>
                {evaluation.errors[field.id]}
              </span>
            ) : field.hint ? (
              <span className="field-hint" id={`anatomy-hint-${field.id}`}>
                {field.hint}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="osmolality-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Geschätzte Serumosmolalität</span>
          <code>
            {pose
              ? `${formatNumber(pose.contributions[0], 2)} + ${formatNumber(pose.contributions[1], 2)} + ${formatNumber(pose.contributions[2], 2)}`
              : '2 × Na + Glukose + Harnstoff'}
          </code>
        </div>
        <div>
          <strong data-anatomy-result>{pose ? formatNumber(pose.result, 1) : '—'}</strong>
          <small>mOsm/kg</small>
        </div>
      </div>
      {evaluation.formError && (
        <p role="alert" className="anatomy-error">
          {evaluation.formError}
        </p>
      )}
      <p className="osmolality-shared">
        Mit dem Rechner oben verbunden: Werte und Einheiten gelten für beide Ansichten. Natrium und
        umgerechnete Glukose sowie Harnstoff gehen in mmol/l in die Summe ein.
      </p>
      <div className="osmolality-experiments">
        <p>Jeweils nur einen Beitrag verändern:</p>
        <div>
          {presets.map((p) => (
            <button key={p.label} onClick={() => props.onPreset(p.values)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="osmolality-note">
        Die Dosierbank zeigt proportionale Rechenmengen, keine getrennten Körperräume oder
        tatsächlichen Stoffmengen. {osmolalityCalculator.note}
      </p>
    </section>
  );
}
