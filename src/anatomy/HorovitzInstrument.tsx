import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Values } from '../calculators';
import { formatNumber } from '../calculators';
import { horovitzInputs, horovitzPose } from './horovitz-model';
import { horovitzPoint, horovitzBounds, horovitzSolid } from './horovitz-solid';
import art from './horovitz-art.json';
import { useTouchLock } from './touch';
type Input = (typeof horovitzInputs)[number];
type Props = {
  values: Values | null;
  onInput: (field: Input, value: number) => void;
  steps: Record<string, number>;
};
export function HorovitzInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  useTouchLock(svg, '.horovitz-handle');
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number } | null>(null);
  const pose = props.values ? horovitzPose(props.values) : null;
  useEffect(() => {
    const element = svg.current!;
    const fills = Object.fromEntries(
      ['oxygen', 'rest', 'divider', 'pao2', 'result'].map((key) => [
        key,
        element.querySelector<SVGGElement>(`[data-horovitz-group=${key}]`)!,
      ]),
    );
    const rigid = ['mixHandle', 'paHandle', 'resultHandle'].map((key) => [
      ...element.querySelectorAll<SVGGElement>(`[data-horovitz-group=${key}]`),
    ]);
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-horovitz-handle]')];
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
        delete element.dataset.horovitzResult;

        if (readout.current) readout.current.textContent = 'Bitte PaO₂ und FiO₂ gültig eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of horovitzInputs) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.14));
        current[field] = Math.abs(n - target[field]) < 0.000001 ? target[field] : n;
        moving ||= current[field] !== target[field];
      }
      const state = horovitzPose(current);
      if (!state) return;
      for (const [key, bounds] of Object.entries(horovitzBounds(state)))
        fills[key].innerHTML = horovitzSolid(art, bounds, key === 'result');
      rigid.forEach((nodes, i) => {
        const delta =
          i === 0
            ? state.oxygenWidth - art.initialOxygenWidth
            : state.heights[i - 1] - art.initialHeights[i - 1];
        const v = i === 0 ? art.xVector : art.zVector;
        nodes.forEach((node) =>
          node.setAttribute('transform', `translate(${delta * v[0]} ${delta * v[1]})`),
        );
      });
      handles.forEach((rect, i) => {
        const p =
          i === 0
            ? horovitzPoint(art, -120 + state.oxygenWidth, 24, 24)
            : horovitzPoint(art, 16, 22.4, 24 + state.heights[0]);
        const r = (22 * art.width) / element.getBoundingClientRect().width;
        for (const [name, value] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: 2 * r,
          height: 2 * r,
        }))
          rect.setAttribute(name, String(value));
      });
      Object.assign(element.dataset, {
        horovitzPao2: String(state.pao2),
        horovitzFio2: String(state.fio2),
        horovitzResult: String(state.result),
        horovitzScale: String(state.scale),
        horovitzOxygenWidth: String(state.oxygenWidth),
        horovitzPaHeight: String(state.heights[0]),
        horovitzResultHeight: String(state.heights[1]),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(state.pao2, 1)} / ${formatNumber(state.fraction, 2)} = ${formatNumber(state.result, 0)} mmHg · Skala 0–${formatNumber(state.scale, 0)}`;
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
    const min = field === 'fio2' ? 21 : 0.000001,
      max = field === 'fio2' ? 100 : Math.max(400, latest.current.values?.pao2 ?? 400);
    if (Number.isFinite(value))
      latest.current.onInput(field, Math.max(min, Math.min(max, Number(value.toPrecision(12)))));
  };
  return (
    <figure className="horovitz-figure iso" data-theme="light">
      <div className="iso-plate horovitz-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 08 · O₂-Normierbank</span>
          <span>PaO₂ / FiO₂</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg horovitz-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Normierbank: Links stellt ein Schieber den Sauerstoffanteil ein. Rechts stehen PaO₂ und der berechnete P/F auf derselben Druckskala."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-horovitz-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {horovitzInputs.map((field, i) => {
            const p =
                i === 0
                  ? horovitzPoint(art, -120 + (pose?.oxygenWidth ?? art.initialOxygenWidth), 24, 24)
                  : horovitzPoint(art, 16, 22.4, 24 + (pose?.heights[0] ?? art.initialHeights[0])),
              r = 18;
            return (
              <g
                key={field}
                className="horovitz-handle"
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-label={`${field === 'fio2' ? 'FiO₂' : 'PaO₂'} an der Normierbank ändern`}
                aria-orientation={field === 'fio2' ? 'horizontal' : 'vertical'}
                aria-valuemin={field === 'fio2' ? 21 : 0.000001}
                aria-valuemax={field === 'fio2' ? 100 : Math.max(400, pose?.pao2 ?? 400)}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose
                    ? `${formatNumber(pose[field], 1)} ${field === 'fio2' ? '%' : 'mmHg'}`
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
                      ? field === 'fio2'
                        ? 21
                        : 0.000001
                      : e.key === 'End'
                        ? field === 'fio2'
                          ? 100
                          : Math.max(400, pose.pao2)
                        : pose[field] +
                          (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) * props.steps[field],
                  );
                }}
                onPointerDown={(e) => {
                  if (!pose) return;
                  const p = atPointer(e);
                  if (!p) return;
                  e.preventDefault();
                  drag.current = { field, start: field === 'fio2' ? p.x : p.y, value: pose[field] };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    p = atPointer(e);
                  if (!d || d.field !== field || !p) return;
                  setInput(
                    field,
                    d.value +
                      Math.round(
                        (field === 'fio2'
                          ? ((p.x - d.start) / art.xVector[0] / 96) * 100
                          : (p.y - d.start) / art.zVector[1] / (pose?.unit ?? 0.45)) /
                          props.steps[field],
                      ) *
                        props.steps[field],
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
                  data-horovitz-handle={field}
                  x={p[0] - r}
                  y={p[1] - r}
                  width={2 * r}
                  height={2 * r}
                  fill="transparent"
                  rx="5"
                />
                <title>Anteil seitlich, Druck vertikal ziehen; Pfeiltasten zum Einstellen</title>
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Links FiO₂ ↔ · rechts PaO₂ ↕ · Knöpfe ziehen</span>
          <span ref={readout}>
            {pose ? `P/F ${formatNumber(pose.result, 0)} mmHg` : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Links: FiO₂ als Anteil des gesamten Gemischs; die Trennfläche ist eine Rechenhilfe. Rechts:
        Grau = PaO₂, hell = P/F. Beide Säulen nutzen dieselbe Druckskala, mindestens 0–400 mmHg; bei
        größeren Werten erweitert sie sich gemeinsam. Bei 100 % O₂ sind beide gleich hoch.
      </figcaption>
    </figure>
  );
}
