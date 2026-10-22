import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { formatNumber } from '../calculators';
import type { Values } from '../calculators';
import art from './map-art.json';
import { mapExample, mapPose } from './map-model';
import { mapBeam, mapPoint } from './map-beam';

type Input = 'systolic' | 'diastolic';
type Props = { values: Values | null; onInput: (field: Input, value: number) => void };
const initialPose = mapPose(mapExample)!;
const sections = [
  [-120, -40],
  [-40, 120],
];
const initialBeams = sections.map(([a, b]) => mapBeam(initialPose, a, b));

export function MapInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef<() => void>(() => {});
  const drag = useRef<{ field: Input; start: number; pressure: number; scale: number } | null>(
    null,
  );
  const pose = props.values ? mapPose(props.values) : null;

  useEffect(() => {
    const element = svg.current!;
    const groups = [0, 1, 2].map((i) => [
      ...element.querySelectorAll<SVGGElement>(`[data-map-group="slider${i}"]`),
    ]);
    const beams = [...element.querySelectorAll<SVGGElement>('[data-map-beam]')];
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-map-handle]')];
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
        if (readout.current)
          readout.current.textContent =
            'Bitte gültige systolische und diastolische Werte eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of ['systolic', 'diastolic']) {
        const next = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.12));
        current[field] = Math.abs(next - target[field]) < 0.00001 ? target[field] : next;
        moving ||= current[field] !== target[field];
      }
      const state = mapPose(current);
      if (!state) return;
      groups.forEach((nodes, i) => {
        const dz = state.heights[i] - art.initialHeights[i];
        const transform = `translate(${dz * art.zVector[0]} ${dz * art.zVector[1]})`;
        nodes.forEach((node) => node.setAttribute('transform', transform));
      });
      beams.forEach((node, i) => {
        const paths = mapBeam(state, sections[i][0], sections[i][1]);
        for (const [name, d] of Object.entries(paths))
          node.querySelector(`[data-map-face="${name}"]`)?.setAttribute('d', d);
      });
      handles.forEach((rect, i) => {
        const point = mapPoint(i === 0 ? -120 : 120, 16, state.heights[i === 0 ? 0 : 2] + 2.5);
        const radius = (24 * art.width) / element.getBoundingClientRect().width;
        rect.setAttribute('x', String(point[0] - radius));
        rect.setAttribute('y', String(point[1] - radius));
        rect.setAttribute('width', String(radius * 2));
        rect.setAttribute('height', String(radius * 2));
      });
      element.dataset.mapSystolic = String(state.systolic);
      element.dataset.mapDiastolic = String(state.diastolic);
      element.dataset.mapResult = String(state.result);
      if (readout.current)
        readout.current.textContent = `Am Instrument: ${formatNumber(state.diastolic, 1)} + ⅓ × ${formatNumber(state.pulse, 1)} = ${formatNumber(state.result, 1)} mmHg`;
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

  const yAt = (event: PointerEvent<SVGGElement>) => {
    const matrix = svg.current?.getScreenCTM();
    return matrix
      ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()).y
      : null;
  };
  const setInput = (field: Input, value: number) => {
    const values = latest.current.values;
    if (!values) return;
    const next =
      field === 'systolic' ? Math.max(values.diastolic, value) : Math.min(values.systolic, value);
    latest.current.onInput(field, Math.max(0.000001, next));
  };
  return (
    <figure className="anatomy-figure map-figure iso" data-theme="light" data-unique-map>
      <div className="iso-plate anatomy-plate map-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 13 · Drittel-Brücke</span>
          <span>Skala 0–{pose?.scale ?? 240} mmHg</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg map-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Drittel-Brücke: links diastolischer Druck, rechts systolischer Druck; der helle Abnehmer sitzt ein Drittel des Abstands von links."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-map-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
            >
              {part.group === 'beam' ? (
                <g className="iso-solid" data-map-beam={part.name}>
                  {Object.entries(initialBeams[part.name.endsWith('0') ? 0 : 1]).map(
                    ([name, d]) => (
                      <path
                        key={name}
                        data-map-face={name}
                        d={d}
                        className={
                          name === 'fill'
                            ? 'iso-fill'
                            : name === 'front' || name === 'right'
                              ? 'iso-shade'
                              : name === 'top'
                                ? 'iso-top'
                                : `iso-line ${name === 'outline' ? 'iso-edge' : name === 'crease' ? 'iso-crease' : ''}`
                        }
                        data-shade={name === 'front' ? 2 : name === 'right' ? 0 : undefined}
                        data-tone={name === 'outline' ? 'hi' : name === 'ticks' ? 'lo' : 'faint'}
                      />
                    ),
                  )}
                </g>
              ) : (
                <g dangerouslySetInnerHTML={{ __html: part.svg }} />
              )}
            </g>
          ))}
          {(['diastolic', 'systolic'] as const).map((field) => (
            <g
              key={field}
              className="map-handle"
              role="slider"
              tabIndex={pose ? 0 : -1}
              aria-label={`${field === 'diastolic' ? 'Diastolischen' : 'Systolischen'} Druck am Instrument ändern`}
              aria-orientation="vertical"
              aria-valuemin={field === 'systolic' ? pose?.diastolic : 0.000001}
              aria-valuemax={field === 'diastolic' ? pose?.systolic : pose?.scale}
              aria-valuenow={pose?.[field]}
              aria-valuetext={pose ? `${formatNumber(pose[field], 1)} mmHg` : undefined}
              style={{ display: pose ? undefined : 'none' }}
              onKeyDown={(event) => {
                if (!pose || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                setInput(
                  field,
                  event.key === 'Home'
                    ? field === 'systolic'
                      ? pose.diastolic
                      : 0.000001
                    : event.key === 'End'
                      ? field === 'diastolic'
                        ? pose.systolic
                        : pose.scale
                      : pose[field] + (event.key === 'ArrowUp' ? 1 : -1),
                );
              }}
              onPointerDown={(event) => {
                if (!pose) return;
                const y = yAt(event);
                if (y === null) return;
                event.preventDefault();
                drag.current = { field, start: y, pressure: pose[field], scale: pose.scale };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const active = drag.current,
                  y = yAt(event);
                if (!active || y === null) return;
                setInput(
                  active.field,
                  Math.round(
                    active.pressure + (((y - active.start) / art.zVector[1]) * active.scale) / 130,
                  ),
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
                data-map-handle={field}
                x="0"
                y="0"
                width="0"
                height="0"
                rx="6"
                fill="transparent"
              />
              <title>
                {field === 'diastolic' ? 'Linken' : 'Rechten'} Knopf vertikal ziehen oder ↑ ↓
                drücken
              </title>
            </g>
          ))}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Linken oder rechten Knopf ziehen · ↑ ↓</span>
          <span ref={readout}>
            {pose ? `MAD ${formatNumber(pose.result, 1)} mmHg` : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption className="map-caption">
        Der helle Abnehmer steht bei <strong>⅓ des Abstands von links</strong>. Seine Höhe folgt
        beiden Eingaben. Die Skala bleibt bis 240 mmHg fest; bei höheren Werten wird sie erweitert.
      </figcaption>
    </figure>
  );
}
