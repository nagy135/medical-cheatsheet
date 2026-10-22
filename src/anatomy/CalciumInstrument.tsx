import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Values } from '../calculators';
import { formatNumber } from '../calculators';
import { calciumInputs, calciumPose } from './calcium-model';

import art from './calcium-art.json';
const calciumPoint = (P: typeof art, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
type Input = (typeof calciumInputs)[number];
type Props = {
  values: Values | null;
  onInput: (field: Input, value: number) => void;
  steps: Record<string, number>;
};
export function CalciumInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number } | null>(null);
  const pose = props.values ? calciumPose(props.values) : null;
  useEffect(() => {
    const element = svg.current!;
    const rigid = ['measured', 'corrected'].map((key) => [
      ...element.querySelectorAll<SVGGElement>(`[data-calcium-group=${key}]`),
    ]);
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-calcium-handle]')];
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
        delete element.dataset.calciumResult;

        if (readout.current)
          readout.current.textContent = 'Bitte Kalzium und Albumin gültig eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of calciumInputs) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.14));
        current[field] = Math.abs(n - target[field]) < 0.000001 ? target[field] : n;
        moving ||= current[field] !== target[field];
      }
      const state = calciumPose(current);
      if (!state) return;
      rigid.forEach((nodes, i) => {
        const delta =
          i === 0 ? state.measuredX - art.initialMeasuredX : state.resultX - art.initialResultX;
        nodes.forEach((node) =>
          node.setAttribute(
            'transform',
            `translate(${delta * art.xVector[0]} ${delta * art.xVector[1]})`,
          ),
        );
      });
      handles.forEach((rect, i) => {
        const p = calciumPoint(art, i === 0 ? -110 : 110, 71, 16.4),
          r = (22 * art.width) / element.getBoundingClientRect().width;
        for (const [name, value] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: 2 * r,
          height: 2 * r,
        }))
          rect.setAttribute(name, String(value));
      });
      Object.assign(element.dataset, {
        calciumMeasured: String(state.calcium),
        calciumAlbumin: String(state.albumin),
        calciumResult: String(state.result),
        calciumCorrection: String(state.correction),
        calciumMeasuredX: String(state.measuredX),
        calciumResultX: String(state.resultX),
        calciumUnit: String(state.unit),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(state.calcium, 2)} ${state.correction < 0 ? '−' : '+'} ${formatNumber(Math.abs(state.correction), 2)} = ${formatNumber(state.result, 2)} mmol/l`;
      if (moving) run();
    }
    wake.current = () => {
      last = 0;
      run();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.at(-1)!.isIntersecting;
        if (!visible && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        last = 0;
        run();
      },
      { rootMargin: '60px' },
    );
    observer.observe(element);
    const resume = () => {
      last = 0;
      run();
    };
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      wake.current = () => {};
    };
  }, []);
  useEffect(() => {
    wake.current();
  }, [props.values]);
  const atPointer = (e: PointerEvent<SVGGElement>) => {
    const m = svg.current?.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : null;
  };
  const setInput = (field: Input, value: number) => {
    const min = 0.000001,
      max = field === 'albumin' ? 100 : Math.max(5, latest.current.values?.calcium ?? 5);
    if (Number.isFinite(value))
      latest.current.onInput(field, Math.max(min, Math.min(max, Number(value.toPrecision(12)))));
  };
  return (
    <figure className="calcium-figure iso" data-theme="light">
      <div className="iso-plate calcium-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 07 · Korrekturschlitten</span>
          <span>Ca + 0,02 × (40 − Alb)</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg calcium-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Compound-Schlitten: Gemessenes Kalzium bewegt den unteren Schlitten. Albumin verschiebt den hellen oberen Kopf um den vorzeichenbehafteten Korrekturterm."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-calcium-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {calciumInputs.map((field, i) => {
            const p = calciumPoint(art, i === 0 ? -110 : 110, 71, 16.4),
              r = 18;
            return (
              <g
                key={field}
                className="calcium-handle"
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-label={`${field === 'calcium' ? 'Kalzium' : 'Albumin'} am Korrekturschlitten ändern`}
                aria-orientation="vertical"
                aria-valuemin={0.000001}
                aria-valuemax={field === 'albumin' ? 100 : Math.max(5, pose?.calcium ?? 5)}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose
                    ? `${formatNumber(pose[field], field === 'calcium' ? 2 : 1)} ${field === 'calcium' ? 'mmol/l' : 'g/l'}`
                    : undefined
                }
                style={{ display: pose ? undefined : 'none' }}
                onKeyDown={(e) => {
                  if (
                    !pose ||
                    !['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(
                      e.key,
                    )
                  )
                    return;
                  e.preventDefault();
                  setInput(
                    field,
                    e.key === 'Home'
                      ? 0.000001
                      : e.key === 'End'
                        ? field === 'albumin'
                          ? 100
                          : Math.max(5, pose.calcium)
                        : pose[field] +
                          (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) * props.steps[field],
                  );
                }}
                onPointerDown={(e) => {
                  if (!pose) return;
                  const p = atPointer(e);
                  if (!p) return;
                  e.preventDefault();
                  drag.current = { field, start: p.y, value: pose[field] };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    p = atPointer(e);
                  if (!d || d.field !== field || !p) return;
                  const delta =
                    ((p.y - d.start) / art.zVector[1]) * (field === 'calcium' ? 0.02 : 1);
                  setInput(
                    field,
                    d.value + Math.round(delta / props.steps[field]) * props.steps[field],
                  );
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
                  data-calcium-handle={field}
                  x={p[0] - r}
                  y={p[1] - r}
                  width={2 * r}
                  height={2 * r}
                  fill="transparent"
                  rx="5"
                />
                <title>Knopf vertikal ziehen oder mit Pfeiltasten einstellen</title>
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Links Kalzium · rechts Albumin · Knöpfe ↕ ziehen</span>
          <span ref={readout}>
            {pose
              ? `Ca korr. ${formatNumber(pose.result, 2)} mmol/l`
              : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Unterer Schlitten: gemessenes Kalzium. Heller Kopf: korrigierter Wert. Albumin stellt den
        Versatz relativ zum unteren Schlitten ein: unter 40 g/l nach rechts, über 40 nach links. Bei
        40 g/l stehen beide Mittellinien übereinander. Für große Kalziumwerte erweitert sich die
        gemeinsame Skala; der Abstand zwischen den zwei festen Messmarken entspricht{' '}
        {pose ? formatNumber(pose.scale, 2) : '—'} mmol/l.
      </figcaption>
    </figure>
  );
}
