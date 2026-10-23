import { useEffect, useRef } from 'react';
import { evaluateCalculator, formatNumber } from '../calculators';
import { NumericInput } from '../NumericInput';
import { pbwCalculator, pbwCenters, pbwPose } from './pbw-model';
import type { PbwPose } from './pbw-model';
import { pbwMeasure, pbwPoint } from './pbw-solid';
import { useTouchLock } from './touch';
import art from './pbw-art.json';
import './iso.css';
import './anatomy.css';
import './pbw.css';
export type PbwAnatomyProps = {
  raw: Record<string, string>;
  units: Record<string, number>;
  onChange: (field: string, value: string) => void;
  onUnitChange: (field: string, index: number) => void;
  onPreset: (values: Record<string, string>) => void;
};
function PbwInstrument({
  pose,
  onChange,
}: {
  pose: PbwPose | null;
  onChange: PbwAnatomyProps['onChange'];
}) {
  const svgRef = useRef<SVGSVGElement>(null),
    footer = useRef<HTMLSpanElement>(null);
  const latest = useRef({ pose, onChange });
  latest.current = { pose, onChange };
  const wake = useRef(() => {});
  const drag = useRef<{ y: number; value: number } | null>(null);
  useTouchLock(svgRef, '.pbw-handle');
  useEffect(() => {
    const svg = svgRef.current!;
    const measures = pbwCenters.map((_, i) =>
      svg.querySelector<SVGGElement>(`[data-pbw-group=measure${i}]`)!,
    );
    const shuttle = svg.querySelector<SVGGElement>('[data-pbw-group=selector]')!;
    const handles = [...svg.querySelectorAll<SVGRectElement>('[data-pbw-hit]')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0,
      last = 0,
      visible = false,
      current: { pbw: number; selectorX: number } | null = null;
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
        delete svg.dataset.pbwResult;
        delete svg.dataset.pbwHeight;
        delete svg.dataset.pbwMeasure;
        return;
      }
      current ??= { pbw: target.pbw, selectorX: target.selectorX };
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      const alpha = reduced.matches ? 1 : 1 - Math.exp(-dt / 0.14);
      for (const key of ['pbw', 'selectorX'] as const) {
        current[key] += (target[key] - current[key]) * alpha;
        if (Math.abs(current[key] - target[key]) < 1e-7) current[key] = target[key];
      }
      measures.forEach((g, i) => {
        const [x, y] = pbwCenters[i];
        g.innerHTML = pbwMeasure(art, x, y, current!.pbw * 0.5);
      });
      const delta = current.selectorX - art.initialSelectorX;
      shuttle.setAttribute(
        'transform',
        `translate(${delta * art.xVector[0]} ${delta * art.xVector[1]})`,
      );
      const r = Math.max(18, (22 * art.width) / svg.getBoundingClientRect().width);
      handles.forEach((h, i) => {
        const p = pbwPoint(art, i ? 52 : -52, 104, 14);
        for (const [k, v] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: 2 * r,
          height: 2 * r,
        }))
          h.setAttribute(k, String(v));
      });
      Object.assign(svg.dataset, {
        pbwResult: String(current.pbw * 6),
        pbwMeasure: String(current.pbw),
        pbwHeight: String(target.height),
        pbwSex: String(target.sex),
      });
      if (footer.current)
        footer.current.textContent = `6 × ${formatNumber(current.pbw, 2)} ≈ ${formatNumber(current.pbw * 6, 2)} ml`;
      if (current.pbw !== target.pbw || current.selectorX !== target.selectorX) run();
    }
    wake.current = () => {
      last = 0;
      run();
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.at(-1)!.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      last = 0;
      run();
    });
    observer.observe(svg);
    const resume = () => {
      last = 0;
      run();
    };
    const resize = new ResizeObserver(resume);
    resize.observe(svg);
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
  }, [pose]);
  const setHeight = (v: number) =>
    onChange(
      'height',
      String(Math.min(250, Math.max(100, Math.round(v * 10) / 10))).replace('.', ','),
    );
  return (
    <figure className="pbw-figure iso" data-theme="light">
      <div className="iso-plate pbw-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. · Sechsfach-Karussell</span>
          <span>6 ml/kg PBW</span>
        </div>
        <svg
          ref={svgRef}
          className="iso-svg pbw-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Dosierkarussell mit sechs gleichen Messkammern. Jede Füllung ist proportional zum vorhergesagten Körpergewicht. Größenrad links, Formelschalter rechts."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-pbw-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          <g
            className="pbw-handle"
            role="slider"
            tabIndex={pose ? 0 : -1}
            style={{ display: pose ? undefined : 'none' }}
            aria-label="Körpergröße am Größenrad ändern"
            aria-orientation="vertical"
            aria-valuemin={100}
            aria-valuemax={250}
            aria-valuenow={pose?.height}
            aria-valuetext={pose ? `${formatNumber(pose.height, 1)} cm` : undefined}
            onKeyDown={(e) => {
              if (
                !pose ||
                !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
              )
                return;
              e.preventDefault();
              setHeight(
                e.key === 'Home'
                  ? 100
                  : e.key === 'End'
                    ? 250
                    : pose.height +
                      (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) * (e.shiftKey ? 10 : 1),
              );
            }}
            onPointerDown={(e) => {
              if (!pose) return;
              e.preventDefault();
              drag.current = { y: e.clientY, value: pose.height };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (drag.current) setHeight(drag.current.value + (drag.current.y - e.clientY) * 0.5);
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
            <rect
              data-pbw-hit="height"
              x="0"
              y="0"
              width="44"
              height="44"
              rx="5"
              fill="transparent"
            />
            <title>Vertikal ziehen; Pfeiltasten ±1 cm, Umschalt ±10 cm</title>
          </g>
          <g
            className="pbw-handle pbw-switch"
            role="switch"
            tabIndex={pose ? 0 : -1}
            style={{ display: pose ? undefined : 'none' }}
            aria-label="Formelparameter männlich"
            aria-checked={pose?.sex === 1}
            onPointerDown={(event) => {
              event.preventDefault();
              if (pose) onChange('sex', pose.sex === 1 ? '0' : '1');
            }}
            onKeyDown={(e) => {
              if (!pose || ![' ', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
              e.preventDefault();
              onChange(
                'sex',
                e.key === 'ArrowLeft'
                  ? '0'
                  : e.key === 'ArrowRight'
                    ? '1'
                    : pose.sex === 1
                      ? '0'
                      : '1',
              );
            }}
          >
            <rect data-pbw-hit="sex" x="0" y="0" width="44" height="44" rx="5" fill="transparent" />
            <title>Formelwahl umschalten: 50 oder 45,5 kg Basis</title>
          </g>
        </svg>
        <div className="anatomy-figure-footer">
          <span>Links ↕ Größe · Rechts: Formelwahl</span>
          <span ref={footer}>
            {pose
              ? `6 × ${formatNumber(pose.pbw, 2)} ≈ ${formatNumber(pose.result, 2)} ml`
              : 'Bitte Größe und Formelparameter gültig eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Sechs identische Kammern: je PBW × 1 ml/kg. Gleicher Querschnitt und gleicher Maßstab in
        jeder Kammer; die Füllhöhen ändern sich gemeinsam. Das Karussell veranschaulicht die
        Multiplikation, keine Beatmungsmechanik.
      </figcaption>
    </figure>
  );
}
export function PbwAnatomy({ raw, units, onChange, onUnitChange, onPreset }: PbwAnatomyProps) {
  const evaluation = evaluateCalculator(pbwCalculator, raw, units);
  const pose = evaluation.result === null ? null : pbwPose(evaluation.values);
  return (
    <section
      className="anatomy-panel pbw-panel"
      data-anatomy="atemzugvolumen"
      data-instrument="six-chamber-carousel"
      aria-labelledby="anatomy-title-pbw"
    >
      <header className="anatomy-header">
        <div>
          <span className="anatomy-eyebrow">ANATOMY · INDIVIDUELLES MODELL</span>
          <h2 id="anatomy-title-pbw">Das Sechsfach-Karussell</h2>
          <p>
            Die Körpergröße und der gewählte Formelparameter bestimmen das vorhergesagte
            Körpergewicht. Sechs gleiche Messkammern machen daraus den Rechenwert bei 6 ml/kg PBW.
          </p>
        </div>
        <span className="anatomy-method">6 × PBW</span>
      </header>
      <PbwInstrument pose={pose} onChange={onChange} />
      <div className="pbw-controls">
        {pbwCalculator.fields.map((field) => (
          <div key={field.id} className="pbw-input">
            <label htmlFor={`anatomy-${field.id}`}>{field.label}</label>
            {field.options ? (
              <select
                id={`anatomy-${field.id}`}
                value={raw[field.id] ?? ''}
                aria-invalid={!!evaluation.errors[field.id]}
                aria-describedby={
                  evaluation.errors[field.id] ? `anatomy-error-${field.id}` : undefined
                }
                onChange={(e) => onChange(field.id, e.target.value)}
              >
                <option value="">Bitte wählen</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <NumericInput
                idPrefix="anatomy"
                field={field}
                value={raw[field.id] ?? ''}
                unitIndex={units[field.id] ?? 0}
                error={evaluation.errors[field.id]}
                onChange={(v) => onChange(field.id, v)}
                onUnitChange={(i) => onUnitChange(field.id, i)}
              />
            )}
            {evaluation.errors[field.id] && (
              <span className="field-error" id={`anatomy-error-${field.id}`}>
                {evaluation.errors[field.id]}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="pbw-answer" aria-live="polite" aria-atomic="true">
        <div>
          <span>Vorhergesagtes Körpergewicht · PBW</span>
          <b>
            {pose ? formatNumber(pose.pbw, 2) : '—'} <small>kg</small>
          </b>
        </div>
        <div>
          <span>Atemzugvolumen bei 6 ml/kg PBW</span>
          <strong data-anatomy-result>
            {pose ? formatNumber(pose.result, pbwCalculator.precision) : '—'}
          </strong>
          <small> ml</small>
        </div>
      </div>
      {evaluation.formError && (
        <p role="alert" className="anatomy-error">
          {evaluation.formError}
        </p>
      )}
      <p className="pbw-equation">
        {pose
          ? `${formatNumber(pose.baseline, 1)} + 0,91 × (${formatNumber(pose.height, 1)} − 152,4) = ${formatNumber(pose.pbw, 2)} kg PBW`
          : pbwCalculator.formula}
        <br />
        {pbwCalculator.formulaDetail}
      </p>
      <div className="pbw-presets">
        <span>Einflüsse vergleichen:</span>
        <button onClick={() => onPreset({ height: '175', sex: '1' })}>175 cm · männlich</button>
        <button onClick={() => onPreset({ height: '175', sex: '0' })}>175 cm · weiblich</button>
        <button onClick={() => onPreset({ height: '190', sex: '1' })}>190 cm · männlich</button>
        <button onClick={() => onPreset({ height: '100', sex: '0' })}>
          Kurze Größe · Validierung
        </button>
      </div>
      <p className="pbw-note">
        Alle Eingaben sind mit dem Hauptrechner verbunden. PBW wird aus Größe und Formelparameter
        berechnet; tatsächliches Körpergewicht geht hier nicht ein. {pbwCalculator.note}
      </p>
    </section>
  );
}
