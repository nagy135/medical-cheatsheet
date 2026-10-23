import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { formatNumber, parseGermanNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import { bmiCalculator, bmiEvaluation, bmiInputs, bmiPose } from './bmi-model';
import type { BmiPose } from './bmi-model';
import { bmiBounds, bmiPoint, bmiSolid } from './bmi-solid';
import { useTouchLock } from './touch';
import art from './bmi-art.json';
import './iso.css';
import './anatomy.css';
import './bmi.css';
export type BmiAnatomyProps = {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
};
type Input = (typeof bmiInputs)[number];
const presets = [
  { weight: '75', height: '175', label: '75 kg · 175 cm' },
  { weight: '100', height: '175', label: 'Nur Gewicht → 100 kg' },
  { weight: '75', height: '200', label: 'Nur Größe → 200 cm' },
];
function BmiInstrument({
  pose,
  onInput,
  steps,
}: {
  pose: BmiPose | null;
  onInput: (field: Input, value: number) => void;
  steps: Record<string, number>;
}) {
  const svgRef = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null),
    latest = useRef({ pose, onInput, steps }),
    wake = useRef(() => {}),
    drag = useRef<{ field: Input; y: number; value: number } | null>(null);
  latest.current = { pose, onInput, steps };
  useTouchLock(svgRef, '.bmi-handle');
  useEffect(() => {
    const svg = svgRef.current!,
      groups = Object.fromEntries(
        ['platen', 'load', 'follower'].map((k) => [
          k,
          svg.querySelector<SVGGElement>(`[data-bmi-group=${k}]`)!,
        ]),
      );
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let current: BmiPose | null = null,
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
      const target = latest.current.pose;
      if (!target) {
        current = null;
        delete svg.dataset.bmiResult;
        if (readout.current) readout.current.textContent = 'Bitte beide Werte gültig eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      current ??= target;
      const next = { weight: current.weight, height: current.height };
      for (const field of bmiInputs) {
        const n = media.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.16));
        next[field] = Math.abs(n - target[field]) < 1e-7 ? target[field] : n;
      }
      current = bmiPose(next)!;
      for (const [kind, b] of Object.entries(bmiBounds(current)))
        groups[kind].innerHTML = bmiSolid(art, b, kind);
      Object.assign(svg.dataset, {
        bmiWeight: String(current.weight),
        bmiHeight: String(current.height),
        bmiArea: String(current.area),
        bmiResult: String(current.result),
        bmiSide: String(current.side),
        bmiThickness: String(current.thickness),
        bmiScale: String(current.verticalScale),
      });
      const moving = bmiInputs.some((f) => current![f] !== target[f]);
      svg.dataset.bmiMoving = String(moving);
      if (readout.current)
        readout.current.textContent = `${formatNumber(current.weight, 1)} kg / ${formatNumber(current.area, 3)} m² = ${formatNumber(current.result, 1)} kg/m²${current.verticalScale < 1.35 ? ' · Höhenmaßstab erweitert' : ''}`;
      if (moving) run();
    }
    wake.current = () => {
      last = 0;
      run();
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)!.isIntersecting;
      svg.dataset.bmiVisible = String(visible);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      last = 0;
      run();
    });
    observer.observe(svg);
    const resize = () => {
      const r = (22 * art.width) / svg.getBoundingClientRect().width;
      svg.querySelectorAll<SVGRectElement>('[data-bmi-hit]').forEach((el, i) => {
        const p = bmiPoint(art, i === 0 ? -65 : 65, 132, 19.5);
        for (const [key, n] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: r * 2,
          height: r * 2,
        }))
          el.setAttribute(key, String(n));
      });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(svg);
    resize();
    const resume = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      last = 0;
      run();
    };
    document.addEventListener('visibilitychange', resume);
    media.addEventListener('change', resume);
    return () => {
      observer.disconnect();
      ro.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
      media.removeEventListener('change', resume);
      wake.current = () => {};
    };
  }, []);
  useEffect(() => {
    wake.current();
  }, [pose]);
  const bounds = (field: Input) => {
    const f = bmiCalculator.fields.find((f) => f.id === field)!;
    return { min: Math.ceil((f.min ?? 0) / steps[field]) * steps[field], max: f.max ?? 500 };
  };
  const set = (field: Input, n: number) => {
    const b = bounds(field);
    if (Number.isFinite(n))
      latest.current.onInput(field, Number(Math.max(b.min, Math.min(b.max, n)).toPrecision(12)));
  };
  const pointer = (e: PointerEvent<SVGGElement>) => {
    const m = svgRef.current?.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null;
  };
  const cancel = (e: PointerEvent<SVGGElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  };
  return (
    <figure className="bmi-figure iso" data-theme="light">
      <div className="iso-plate bmi-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 01 · Lastflächenpresse</span>
          <span>Gewicht / Größe²</span>
        </div>
        <svg
          ref={svgRef}
          className="iso-svg bmi-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Vier-Säulen-Presse: Die quadratische Lastfläche wächst mit der Körpergröße. Die Dicke der verteilten Last zeigt Gewicht geteilt durch Größe zum Quadrat."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((p) => (
            <g
              key={p.name}
              data-bmi-group={p.group}
              style={p.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: p.svg }}
            />
          ))}
          {bmiInputs.map((field, i) => {
            const p = bmiPoint(art, i === 0 ? -65 : 65, 132, 19.5),
              r = 22,
              label = field === 'weight' ? 'Körpergewicht' : 'Körpergröße';
            return (
              <g
                key={field}
                className="bmi-handle"
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-label={`${label} an der Presse ändern`}
                aria-orientation="vertical"
                aria-valuemin={bounds(field).min}
                aria-valuemax={bounds(field).max}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose
                    ? `${formatNumber(pose[field], field === 'weight' ? 1 : 0)} ${field === 'weight' ? 'kg' : 'cm'}`
                    : undefined
                }
                style={{ display: pose ? undefined : 'none' }}
                onKeyDown={(e) => {
                  if (!pose) return;
                  if (e.key === 'Escape') {
                    drag.current = null;
                    return;
                  }
                  if (
                    !['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(
                      e.key,
                    )
                  )
                    return;
                  e.preventDefault();
                  set(
                    field,
                    e.key === 'Home'
                      ? bounds(field).min
                      : e.key === 'End'
                        ? bounds(field).max
                        : pose[field] +
                          (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) *
                            steps[field] *
                            (e.shiftKey ? 10 : 1),
                  );
                }}
                onPointerDown={(e) => {
                  if (!pose || !e.isPrimary) return;
                  const p = pointer(e);
                  if (!p) return;
                  e.preventDefault();
                  drag.current = { field, y: p.y, value: pose[field] };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    p = pointer(e);
                  if (!d || d.field !== field || !p) return;
                  const delta = (d.y - p.y) * 0.5;
                  set(field, d.value + Math.round(delta / steps[field]) * steps[field]);
                }}
                onPointerUp={cancel}
                onPointerCancel={cancel}
                onLostPointerCapture={() => {
                  drag.current = null;
                }}
              >
                <rect
                  data-bmi-hit={field}
                  x={p[0] - r}
                  y={p[1] - r}
                  width={r * 2}
                  height={r * 2}
                  rx="5"
                  fill="transparent"
                />
                <title>
                  Vertikal ziehen; Pfeiltasten, Umschalt für zehn Schritte, Pos1 und Ende
                </title>
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Knöpfe ↕ · links Gewicht · rechts Größe</span>
          <span ref={readout} data-readout>
            {pose ? `${formatNumber(pose.result, 1)} kg/m²` : 'Bitte beide Werte gültig eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Quadratische Fläche: Größe × Größe. Türkise Last: Volumen proportional zum Gewicht; ihre
        Dicke zeigt den BMI. Gleiche Größe hält die Fläche fest, mehr Gewicht macht die Last dicker.
        Mehr Größe verteilt dieselbe Last auf eine größere Fläche. Bei großen BMI-Werten erweitert
        sich nur der Höhenmaßstab; die Fläche bleibt maßstäblich. Geometrisches Rechenmodell, keine
        Körperfläche und keine Druckmessung.
      </figcaption>
    </figure>
  );
}
export function BmiAnatomy(props: BmiAnatomyProps) {
  const { raw, units, onChange, onUnitChange, onPreset } = props;
  const evaluation = bmiEvaluation(raw, units),
    p = evaluation.pose;
  const steps = Object.fromEntries(
    bmiCalculator.fields.map((f) => [
      f.id,
      numericFieldSettings(f, units[f.id] ?? 0).step * (f.units?.[units[f.id] ?? 0]?.factor ?? 1),
    ]),
  );
  return (
    <section
      className="anatomy-panel bmi-panel"
      data-anatomy="bmi"
      data-instrument="load-platen"
      aria-labelledby="anatomy-title-bmi"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-bmi">Die Lastflächenpresse</h2>
          <p>
            Eine größere quadratische Auflage verteilt dieselbe Last dünner. Die Körpergröße
            bestimmt beide Kanten der Fläche; das Gewicht bestimmt, wie viel Last darauf liegt.
          </p>
        </div>
        <span className="anatomy-method">kg / m²</span>
      </header>
      <BmiInstrument
        pose={p}
        steps={steps}
        onInput={(field, value) => {
          const f = bmiCalculator.fields.find((f) => f.id === field)!,
            factor = f.units?.[units[field] ?? 0]?.factor ?? 1;
          onChange(field, String(value / factor).replace('.', ','));
        }}
      />
      <div className="bmi-controls">
        {bmiInputs.map((id) => {
          const f = bmiCalculator.fields.find((f) => f.id === id)!,
            settings = numericFieldSettings(f, units[id] ?? 0);
          return (
            <div className="bmi-input" key={id}>
              <label htmlFor={`anatomy-${id}`}>
                {f.label} · {id === 'weight' ? 'Lastvolumen' : 'beide Flächenkanten'}
              </label>
              <NumericInput
                idPrefix="anatomy"
                field={f}
                value={raw[id] ?? ''}
                unitIndex={units[id] ?? 0}
                error={evaluation.errors[id]}
                onChange={(v) => onChange(id, v)}
                onUnitChange={(n) => onUnitChange(id, n)}
              />
              <input
                className="anatomy-range"
                type="range"
                min={Math.ceil((settings.min ?? 0) / settings.step) * settings.step}
                max={settings.max}
                step={settings.step}
                value={parseGermanNumber(raw[id] ?? '') ?? parseGermanNumber(f.example) ?? 0}
                aria-label={`${f.label} an der Presse einstellen`}
                onChange={(e) => onChange(id, e.target.value)}
              />
              {evaluation.errors[id] && (
                <span className="field-error" id={`anatomy-error-${id}`}>
                  {evaluation.errors[id]}
                </span>
              )}
              {f.hint && !evaluation.errors[id] && (
                <span className="field-hint" id={`anatomy-hint-${id}`}>
                  {f.hint}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="bmi-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Gewicht / (Größe in m × Größe in m)</span>
          <code>
            {p
              ? `${formatNumber(p.weight, 1)} / (${formatNumber(p.meters, 2)} × ${formatNumber(p.meters, 2)})`
              : 'Gewicht / Größe²'}
          </code>
        </div>
        <div>
          <strong data-anatomy-result>
            {p ? formatNumber(p.result, bmiCalculator.precision) : '—'}
          </strong>
          <small>kg/m²</small>
        </div>
      </div>
      <div className="bmi-working">
        <div>
          <span>01 · Jede Kante</span>
          <b>
            {p ? formatNumber(p.meters, 2) : '—'} <small>m</small>
          </b>
        </div>
        <div>
          <span>02 · Quadratfläche</span>
          <b>
            {p ? formatNumber(p.area, 3) : '—'} <small>m²</small>
          </b>
        </div>
        <div>
          <span>03 · Last je Fläche</span>
          <b>
            {p ? formatNumber(p.result, 1) : '—'} <small>kg/m²</small>
          </b>
        </div>
      </div>
      <div className="bmi-experiments">
        <p>Jeweils einen Einfluss vergleichen:</p>
        <div>
          {presets.map((v) => (
            <button key={v.label} onClick={() => onPreset({ weight: v.weight, height: v.height })}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="bmi-note">
        Mit dem Rechner oben verbunden: Eingaben, Regler und Knöpfe verändern dieselben Werte.{' '}
        {bmiCalculator.note}
      </p>
    </section>
  );
}
