import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { formatNumber } from '../calculators';
import type { Values } from '../calculators';
import { NumericInput } from '../NumericInput';
import { numericFieldSettings } from '../numeric-input';
import {
  fenaCalculator,
  fenaEvaluation,
  fenaInputs,
  fenaPose,
  fenaPositions,
  fenaRaw,
} from './fena-model';
import type { FenaInput } from './fena-model';
import { fenaColumn, fenaPoint } from './fena-solid';
import { useTouchLock } from './touch';
import art from './fena-art.json';
import './iso.css';
import './anatomy.css';
import './fena.css';

export type FenaAnatomyProps = {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
};
const names = {
  sodium: 'Serumnatrium',
  urineSodium: 'Urinnatrium',
  creatinine: 'Serumkreatinin',
  urineCreatinine: 'Urinkreatinin',
};
const presets = [
  {
    label: 'Beispiel · 0,14 %',
    values: { sodium: '140', urineSodium: '20', creatinine: '1', urineCreatinine: '100' },
  },
  {
    label: 'U-Na verdoppeln · 0,29 %',
    values: { sodium: '140', urineSodium: '40', creatinine: '1', urineCreatinine: '100' },
  },
  {
    label: 'S-Cr verdoppeln · 0,29 %',
    values: { sodium: '140', urineSodium: '20', creatinine: '2', urineCreatinine: '100' },
  },
  {
    label: 'U-Na = 0 · 0,00 %',
    values: { sodium: '140', urineSodium: '0', creatinine: '1', urineCreatinine: '100' },
  },
];
const ratioText = (v: number) =>
  v.toLocaleString('de-DE', {
    maximumFractionDigits: 4,
    notation: v !== 0 && (Math.abs(v) < 0.0001 || Math.abs(v) >= 1e7) ? 'scientific' : 'standard',
  });

function FenaInstrument({
  values,
  units,
  onInput,
}: {
  values: Values | null;
  units: Record<string, number>;
  onInput: (field: FenaInput, value: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null),
    scales = useRef<HTMLSpanElement>(null);
  const latest = useRef({ values, units, onInput });
  latest.current = { values, units, onInput };
  const wake = useRef(() => {});
  const drag = useRef<{ field: FenaInput; start: number; value: number; step: number } | null>(
    null,
  );
  const pose = values ? fenaPose(values) : null;
  useTouchLock(svgRef, '.fena-handle');
  useEffect(() => {
    const svg = svgRef.current!;
    const samples = Object.fromEntries(
      fenaInputs.map((f) => [
        f,
        svg.querySelector<SVGGElement>(`[data-fena-group=sample][data-fena-field=${f}]`)!,
      ]),
    );
    const caps = Object.fromEntries(
      fenaInputs.map((f) => [
        f,
        svg.querySelector<SVGGElement>(`[data-fena-group=cap][data-fena-field=${f}]`)!,
      ]),
    );
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current: Values | null = null,
      frame = 0,
      last = 0,
      visible = false;
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
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of fenaInputs) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.16));
        current[field] =
          Math.abs(n - target[field]) < Math.max(1e-12, Math.abs(target[field]) * 1e-9)
            ? target[field]
            : n;
        moving ||= current[field] !== target[field];
      }
      const p = fenaPose(current);
      if (!p) return;
      for (const field of fenaInputs) {
        const [x, y] = fenaPositions[field];
        samples[field].innerHTML = fenaColumn(art.camera, x, y, p.heights[field]);
        const delta = p.heights[field] - art.initialHeights[field];
        caps[field].setAttribute(
          'transform',
          `translate(${delta * art.zVector[0]} ${delta * art.zVector[1]})`,
        );
        svg.dataset[`fena${field[0].toUpperCase()}${field.slice(1)}`] = String(current[field]);
        svg.dataset[`fenaHeight${field[0].toUpperCase()}${field.slice(1)}`] = String(
          p.heights[field],
        );
      }
      Object.assign(svg.dataset, {
        fenaResult: String(p.result),
        fenaSodiumRatio: String(p.sodiumRatio),
        fenaCreatinineRatio: String(p.creatinineRatio),
      });
      if (readout.current)
        readout.current.textContent = `${ratioText(p.sodiumRatio)} ÷ ${ratioText(p.creatinineRatio)} × 100 = ${formatNumber(p.result, 2)} %`;
      if (scales.current)
        scales.current.textContent = `Volle Höhe: Na ${ratioText(p.sodiumScale)} mmol/l · Cr ${ratioText(p.creatinineScale)} mg/dl`;
      if (moving) run();
      else {
        last = 0;
        svg.dataset.fenaMotion = 'rest';
      }
    }
    wake.current = () => {
      last = 0;
      if (!latest.current.values) {
        current = null;
        drag.current = null;
        for (const key of Object.keys(svg.dataset))
          if (key.startsWith('fena') && key !== 'fenaValid') delete svg.dataset[key];
        if (readout.current)
          readout.current.textContent = 'Vier gültige Konzentrationen eingeben · —';
        if (scales.current) scales.current.textContent = 'Volle Höhe: —';
      } else {
        svg.dataset.fenaMotion = 'pending';
        run();
      }
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)!.isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      last = 0;
      run();
    });
    observer.observe(svg);
    const resize = new ResizeObserver(() => {
      const r = (22 * art.width) / svg.getBoundingClientRect().width;
      svg.querySelectorAll<SVGRectElement>('[data-fena-target]').forEach((rect, i) => {
        const p = fenaPoint(art, -117 + i * 78, 49, 13.4);
        for (const [key, value] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: 2 * r,
          height: 2 * r,
        }))
          rect.setAttribute(key, String(value));
      });
    });
    resize.observe(svg);
    const resume = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
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
  const pointer = (e: PointerEvent<SVGGElement>) => {
    const m = svgRef.current?.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null;
  };
  const setInput = (field: FenaInput, value: number) => {
    const f = fenaCalculator.fields.find((f) => f.id === field)!;
    if (Number.isFinite(value))
      latest.current.onInput(
        field,
        Math.max(f.min ?? 0, Math.min(f.max ?? Infinity, Number(value.toPrecision(12)))),
      );
  };
  return (
    <figure className="iso fena-figure" data-theme="light">
      <div className="iso-plate fena-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 07 · Probenkomparator</span>
          <span>U/S · Na ÷ Cr</span>
        </div>
        <svg
          ref={svgRef}
          className="iso-svg fena-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Labor-Probenkomparator: links die Natrium-, rechts die Kreatininpaarung. Jeweils links Serum, rechts Urin. Die Säulenhöhe zeigt die Konzentration auf einer gemeinsamen Skala je Paar."
          data-fena-valid={!!pose}
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-fena-group={part.group}
              data-fena-field={part.field || undefined}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {fenaInputs.map((field, i) => {
            const f = fenaCalculator.fields.find((f) => f.id === field)!,
              unit = f.units?.[units[field] ?? 0],
              factor = unit?.factor ?? 1;
            const step = numericFieldSettings(f, units[field] ?? 0).step * factor;
            const p = fenaPoint(art, -117 + i * 78, 49, 13.4);
            return (
              <g
                key={field}
                className="fena-handle"
                role="spinbutton"
                tabIndex={pose ? 0 : -1}
                aria-label={`${names[field]} am Probenkomparator ändern`}
                aria-valuenow={values ? values[field] / factor : undefined}
                aria-valuemin={f.min === undefined ? undefined : f.min / factor}
                aria-valuemax={f.max === undefined ? undefined : f.max / factor}
                aria-valuetext={
                  values
                    ? `${formatNumber(values[field] / factor, 4)} ${unit?.label ?? f.unit}`
                    : 'Bitte gültige Werte eingeben'
                }
                style={{ display: pose ? undefined : 'none' }}
                onKeyDown={(e) => {
                  if (
                    !values ||
                    ![
                      'ArrowUp',
                      'ArrowRight',
                      'ArrowDown',
                      'ArrowLeft',
                      'PageUp',
                      'PageDown',
                      'Home',
                    ].includes(e.key)
                  )
                    return;
                  e.preventDefault();
                  setInput(
                    field,
                    e.key === 'Home'
                      ? (f.min ?? 0)
                      : values[field] +
                          (['ArrowUp', 'ArrowRight', 'PageUp'].includes(e.key) ? 1 : -1) *
                            step *
                            (e.key.startsWith('Page') ? 10 : 1),
                  );
                }}
                onPointerDown={(e) => {
                  const p = pointer(e);
                  if (!values || !p) return;
                  e.preventDefault();
                  drag.current = { field, start: p.y, value: values[field], step };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    p = pointer(e);
                  if (!d || d.field !== field || !p) return;
                  setInput(field, d.value + Math.round((d.start - p.y) / 5) * d.step);
                }}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
                onLostPointerCapture={() => {
                  drag.current = null;
                }}
              >
                <rect
                  data-fena-target={field}
                  x={p[0] - 22}
                  y={p[1] - 22}
                  width={44}
                  height={44}
                  rx="10"
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Vier Stellräder · ziehen oder Pfeiltasten</span>
          <span ref={readout} data-fena-readout>
            Vier gültige Konzentrationen eingeben · —
          </span>
        </div>
      </div>
      <figcaption>
        <span className="fena-legend">
          <i />
          Konzentration · je Paar links Serum, rechts Urin mit Ringkappe
        </span>
        <span ref={scales}>Volle Höhe: —</span>
      </figcaption>
    </figure>
  );
}

export function FenaAnatomy({ raw, units, onChange, onUnitChange, onPreset }: FenaAnatomyProps) {
  const evaluation = fenaEvaluation(raw, units),
    pose = evaluation.pose;
  return (
    <section
      className="anatomy-panel fena-panel"
      data-anatomy="fena"
      data-instrument="paired-sample-comparator"
      aria-labelledby="anatomy-title-fena"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-fena">Der Probenkomparator</h2>
          <p>
            Zwei Proben, zwei Konzentrationsverhältnisse. Links wird Urin- mit Serumnatrium
            verglichen, rechts Urin- mit Serumkreatinin. Das Verhältnis dieser beiden Paarungen
            ergibt, mit 100 multipliziert, die fraktionelle Natriumexkretion.
          </p>
        </div>
        <span className="anatomy-method">
          100 × (U-Na / S-Na)
          <br />÷ (U-Cr / S-Cr)
        </span>
      </header>
      <FenaInstrument
        values={pose ? evaluation.values : null}
        units={units}
        onInput={(field, value) => onChange(field, fenaRaw(field, value, units))}
      />
      <div className="fena-ratios" aria-live="polite" aria-atomic="true">
        <div>
          <span>01 · Natriumpaar links · U-Na / S-Na</span>
          <strong data-fena-na-ratio>{pose ? ratioText(pose.sodiumRatio) : '—'}</strong>
          <small> ×</small>
        </div>
        <div>
          <span>02 · Kreatininpaar rechts · U-Cr / S-Cr</span>
          <strong data-fena-cr-ratio>{pose ? ratioText(pose.creatinineRatio) : '—'}</strong>
          <small> ×</small>
        </div>
        <div className="fena-result">
          <span>03 · Natriumverhältnis ÷ Kreatininverhältnis × 100</span>
          <strong data-anatomy-result>
            {pose ? formatNumber(pose.result, fenaCalculator.precision) : '—'}
          </strong>
          <small> %</small>
        </div>
      </div>
      <div className="fena-controls">
        {fenaInputs.map((id, i) => {
          const field = fenaCalculator.fields.find((f) => f.id === id)!;
          return (
            <div key={id} className="fena-input">
              <label htmlFor={`anatomy-${id}`}>
                <span>{String(i + 1).padStart(2, '0')} · Stellrad</span>
                {names[id]}
              </label>
              <NumericInput
                idPrefix="anatomy"
                field={field}
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
              ) : field.hint ? (
                <span className="field-hint" id={`anatomy-hint-${id}`}>
                  {field.hint}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {evaluation.formError && (
        <p className="anatomy-error" role="alert">
          {evaluation.formError}
        </p>
      )}
      <p className="fena-shared">
        Alle vier Stellräder, Eingabefelder und Einheiten sind mit dem Rechner oben verbunden.
        Kreatinin wird für beide Proben in dieselbe Recheneinheit umgerechnet.
      </p>
      <div className="fena-experiments">
        <p>Einzelne Einflüsse vergleichen</p>
        <div>
          {presets.map((p) => (
            <button type="button" key={p.label} onClick={() => onPreset(p.values)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="fena-note">
        Die Säulen zeigen Konzentrationen, keine Probenvolumina. Innerhalb eines Paares gilt
        dieselbe lineare Skala; die jeweils höhere Konzentration füllt die Skala. Natrium und
        Kreatinin haben getrennte Skalen. Entscheidend sind die beiden U/S-Verhältnisse, nicht die
        Höhe zwischen den Paaren.
      </p>
      <p className="fena-note">{fenaCalculator.note}</p>
    </section>
  );
}
