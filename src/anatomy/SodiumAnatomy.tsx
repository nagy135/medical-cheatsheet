import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { formatNumber } from '../calculators';
import type { Values } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { sodiumCalculator, sodiumInputs, sodiumPose, sodiumState } from './sodium-model';
import { sodiumMechanism, sodiumPoint } from './sodium-solid';
import { useTouchLock } from './touch';
import art from './sodium-art.json';
import './iso.css';
import './anatomy.css';
import './sodium.css';
export type SodiumAnatomyProps = {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
};
type Input = (typeof sodiumInputs)[number];
function SodiumInstrument({
  values,
  onInput,
  steps,
}: {
  values: Values | null;
  onInput: (field: Input, value: number) => void;
  steps: Record<Input, number>;
}) {
  const svgRef = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef({ values, onInput, steps });
  latest.current = { values, onInput, steps };
  const wake = useRef(() => {});
  const drag = useRef<{ field: Input; y: number; value: number; pointer: number } | null>(null);
  useTouchLock(svgRef, '.sodium-handle');
  const pose = values ? sodiumPose(values) : null;
  useEffect(() => {
    const svg = svgRef.current!,
      reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = new Map(
      [...svg.querySelectorAll<SVGGElement>('[data-sodium-part]')].map((n) => [
        n.dataset.sodiumPart!,
        n,
      ]),
    );
    const handles = [...svg.querySelectorAll<SVGRectElement>('[data-sodium-target]')];
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
        delete svg.dataset.sodiumResult;
        if (readout.current) readout.current.textContent = 'Bitte beide Werte gültig eingeben.';
        return;
      }
      current ??= { ...target };
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      let moving = false;
      for (const field of sodiumInputs) {
        const delta = target[field] - current[field];
        current[field] =
          reduced.matches || Math.abs(delta) < 1e-8 * Math.max(1, Math.abs(target[field]))
            ? target[field]
            : current[field] + delta * (1 - Math.exp(-dt / 0.16));
        moving ||= current[field] !== target[field];
      }
      const p = sodiumPose(current);
      if (!p) return;
      for (const part of sodiumMechanism(art.projection, p))
        nodes.get(part.name)!.innerHTML = part.svg;
      const positions = [
        sodiumPoint(art, -108, 57, 13.5),
        sodiumPoint(art, 134, -25, p.datum + 246 * p.slope + 9),
      ];
      const r = (22 * art.width) / svg.getBoundingClientRect().width;
      handles.forEach((rect, i) => {
        for (const [key, v] of Object.entries({
          x: positions[i][0] - r,
          y: positions[i][1] - r,
          width: r * 2,
          height: r * 2,
        }))
          rect.setAttribute(key, String(v));
      });
      Object.assign(svg.dataset, {
        sodiumResult: String(p.result),
        sodiumMeasured: String(p.sodium),
        sodiumGlucose: String(p.glucose),
        sodiumCorrection: String(p.correction),
        sodiumTravel: String(p.travel),
        sodiumRise: String(p.rise),
        sodiumUnit: String(p.unit),
        sodiumDatum: String(p.datum),
        sodiumFrame: String(now),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(p.sodium, 1)} + ${formatNumber(p.correction, 1)} = ${formatNumber(p.result, 1)} mmol/l`;
      if (moving) run();
    }
    wake.current = () => {
      last = 0;
      run();
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)!.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      svg.dataset.sodiumVisible = String(visible);
      last = 0;
      run();
    });
    observer.observe(svg);
    const resize = new ResizeObserver(() => wake.current());
    resize.observe(svg);
    const resume = () => {
      last = 0;
      run();
    };
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    return () => {
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      wake.current = () => {};
    };
  }, []);
  useEffect(() => {
    wake.current();
  }, [values]);
  const set = (field: Input, v: number) => {
    const min = sodiumCalculator.fields.find((f) => f.id === field)!.min!;
    if (Number.isFinite(v)) latest.current.onInput(field, Math.max(min, v));
  };
  const at = (e: PointerEvent<SVGGElement>) => {
    const m = svgRef.current?.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null;
  };
  const end = (e: PointerEvent<SVGGElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return (
    <figure className="sodium-figure iso" data-theme="light">
      <div className="iso-plate sodium-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 20 · Katz-Rampe</span>
          <span>Datum + Höhengewinn</span>
        </div>
        <svg
          ref={svgRef}
          className="iso-svg sodium-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Schraubgetriebene Korrekturrampe: Der Sockel setzt das gemessene Natrium, der Abnehmer steigt mit dem Glukoseüberschuss auf der Schräge. Die helle Marke zeigt die Summe."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-sodium-part={part.name}
              data-sodium-variable={part.variable || undefined}
              style={part.variable ? { display: pose ? undefined : 'none' } : undefined}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {sodiumInputs.map((field, i) => {
            const pt = sodiumPoint(
              art,
              i ? 134 : -108,
              i ? -25 : 57,
              i && pose ? pose.datum + 246 * pose.slope + 9 : 13.5,
            );
            return (
              <g
                key={field}
                className="sodium-handle"
                role="spinbutton"
                tabIndex={pose ? 0 : -1}
                aria-label={
                  field === 'sodium'
                    ? 'Gemessenes Natrium am Sockel ändern'
                    : 'Glukose an der Rampenschraube ändern'
                }
                aria-valuemin={sodiumCalculator.fields[i].min}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose
                    ? `${formatNumber(pose[field], 1)} ${field === 'sodium' ? 'mmol/l' : 'mg/dl'}`
                    : undefined
                }
                style={{ display: pose ? undefined : 'none' }}
                onKeyDown={(e) => {
                  if (!pose) return;
                  if (e.key === 'Escape') {
                    const pointer = drag.current?.pointer;
                    if (pointer !== undefined && e.currentTarget.hasPointerCapture(pointer))
                      e.currentTarget.releasePointerCapture(pointer);
                    drag.current = null;
                    return;
                  }
                  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(e.key))
                    return;
                  e.preventDefault();
                  set(
                    field,
                    e.key === 'Home'
                      ? sodiumCalculator.fields[i].min!
                      : pose[field] +
                          (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) *
                            steps[field] *
                            (e.shiftKey ? 10 : 1),
                  );
                }}
                onPointerDown={(e) => {
                  if (!pose || e.button !== 0) return;
                  const p = at(e);
                  if (!p) return;
                  e.preventDefault();
                  e.currentTarget.focus();
                  drag.current = { field, y: p.y, value: pose[field], pointer: e.pointerId };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    p = at(e);
                  if (!d || d.field !== field || d.pointer !== e.pointerId || !p) return;
                  const step = latest.current.steps[field],
                    delta = (d.y - p.y) * (field === 'glucose' ? 5 : 0.5);
                  set(field, d.value + Math.round(delta / step) * step);
                }}
                onPointerUp={end}
                onPointerCancel={end}
                onLostPointerCapture={() => {
                  drag.current = null;
                }}
              >
                <rect
                  data-sodium-target={field}
                  x={pt[0] - 20}
                  y={pt[1] - 20}
                  width="40"
                  height="40"
                  rx="5"
                  fill="transparent"
                />
                <title>
                  Vertikal ziehen · Pfeiltasten · Umschalt für zehn Schritte · Pos1 zum Minimum
                </title>
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Knöpfe ↕ ziehen oder Pfeiltasten verwenden</span>
          <span ref={readout}>
            {pose
              ? `${formatNumber(pose.sodium, 1)} + ${formatNumber(pose.correction, 1)} = ${formatNumber(pose.result, 1)} mmol/l`
              : 'Bitte beide Werte gültig eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Der Sockel setzt die Ausgangshöhe. Die Spindel führt den Abnehmer auf der Schräge; die helle
        Marke steigt um den Korrekturterm über die vordere Datumkante. Gemeinsamer Höhenmaßstab:{' '}
        {pose ? formatNumber(1 / pose.unit, 2) : '—'} mmol/l je Modelleinheit. Rampenweg: 0–
        {pose ? formatNumber(pose.glucoseRange, 0) : '—'} mg/dl Glukoseüberschuss. Beide Maßstäbe
        erweitern sich bei großen Werten; die Zahlen bleiben unverändert.
      </figcaption>
    </figure>
  );
}
export function SodiumAnatomy({
  raw,
  units,
  onChange,
  onUnitChange,
  onPreset,
}: SodiumAnatomyProps) {
  const state = sodiumState(raw, units),
    p = state.pose;
  const steps = Object.fromEntries(
    sodiumCalculator.fields.map((f) => [
      f.id,
      numericFieldSettings(f, units[f.id] ?? 0).step * (f.units?.[units[f.id] ?? 0]?.factor ?? 1),
    ]),
  ) as Record<Input, number>;
  return (
    <section
      className="anatomy-panel sodium-panel"
      data-anatomy="natrium"
      data-instrument="screw-ramp"
      aria-labelledby="anatomy-title-sodium"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-sodium">Die Korrekturrampe</h2>
          <p>
            Eine Schraube macht den Glukoseüberschuss zum Höhengewinn: Je 100 mg/dl über dem
            Rechenbezug 100 steigt die Marke um 1,6 mmol/l. Der Sockel trägt das gemessene Natrium
            bereits bei.
          </p>
        </div>
        <span className="anatomy-method">Katz · Faktor 1,6</span>
      </header>
      <SodiumInstrument
        values={p ? state.values : null}
        steps={steps}
        onInput={(field, v) => {
          const f = sodiumCalculator.fields.find((f) => f.id === field)!,
            factor = f.units?.[units[field] ?? 0]?.factor ?? 1;
          let display = v / factor;
          if (v === f.min && factor !== 1)
            display = Math.ceil(display / (steps[field] / factor)) * (steps[field] / factor);
          onChange(
            field,
            display.toLocaleString('de-DE', { useGrouping: false, maximumFractionDigits: 12 }),
          );
        }}
      />
      <div className="sodium-controls">
        {sodiumCalculator.fields.map((field, i) => (
          <div className="sodium-input" key={field.id}>
            <label htmlFor={`anatomy-${field.id}`}>
              {i ? '02 · Glukose / Rampenweg' : '01 · Gemessenes Natrium / Datum'}
            </label>
            <NumericInput
              idPrefix="anatomy"
              field={field}
              value={raw[field.id] ?? ''}
              unitIndex={units[field.id] ?? 0}
              error={state.errors[field.id]}
              onChange={(v) => onChange(field.id, v)}
              onUnitChange={(index) => onUnitChange(field.id, index)}
            />
            {state.errors[field.id] ? (
              <span className="field-error" id={`anatomy-error-${field.id}`}>
                {state.errors[field.id]}
              </span>
            ) : field.hint ? (
              <span className="field-hint" id={`anatomy-hint-${field.id}`}>
                {field.hint}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="sodium-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Datum + Katz-Korrektur</span>
          <code>
            {p
              ? `${formatNumber(p.sodium, 1)} + ${formatNumber(p.correction, 1)}`
              : 'Na + 1,6 × (Glukose − 100) / 100'}
          </code>
        </div>
        <div>
          <span>Korrigiertes Natrium</span>
          <strong data-anatomy-result>{p ? formatNumber(p.result, 1) : '—'}</strong>
          <small>mmol/l</small>
        </div>
      </div>
      {state.formError && (
        <p role="alert" className="anatomy-error">
          {state.formError}
        </p>
      )}
      <div className="sodium-working">
        <div>
          <span>Glukose in mg/dl</span>
          <b>{p ? formatNumber(p.glucose, 2) : '—'}</b>
        </div>
        <div>
          <span>Überschuss über 100</span>
          <b>{p ? formatNumber(p.excess, 2) : '—'}</b>
        </div>
        <div>
          <span>Zusatzhöhe · mmol/l</span>
          <b>+ {p ? formatNumber(p.correction, 2) : '—'}</b>
        </div>
      </div>
      <p className="sodium-shared">
        Mit dem Rechner oben verbunden. Auch der Einheitenwechsel ändert dieselben Eingaben; mmol/l
        Glukose × 18,0182 ergibt mg/dl.
      </p>
      <div className="sodium-experiments">
        <span>Gleicher Sockel, anderer Rampenweg:</span>
        <div>
          {[
            ['Am Bezug · +0,0', { sodium: '130', glucose: '100' }],
            ['Glukose 400 · +4,8', { sodium: '130', glucose: '400' }],
            ['Glukose 800 · +11,2', { sodium: '130', glucose: '800' }],
            ['Nur Na 140 · 144,8', { sodium: '140', glucose: '400' }],
          ].map(([label, values]) => (
            <button key={String(label)} onClick={() => onPreset(values as Record<string, string>)}>
              {String(label)}
            </button>
          ))}
        </div>
      </div>
      <p className="sodium-note">
        Die Rampe zeigt die Rechenkorrektur, keinen zeitlichen Verlauf und keine Behandlung.{' '}
        {sodiumCalculator.note}
      </p>
    </section>
  );
}
