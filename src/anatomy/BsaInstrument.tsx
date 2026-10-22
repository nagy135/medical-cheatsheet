import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { formatNumber } from '../calculators';
import type { Values } from '../calculators';
import { bsaCalculator, bsaExample, bsaPose } from './bsa-model';
import { bsaBox, bsaPoint } from './bsa-box';
import art from './bsa-art.json';

type Input = 'height' | 'weight';
type Props = {
  values: Values | null;
  form: number;
  onInput: (field: Input, value: number) => void;
};
const initial = bsaPose(bsaExample)!;
export function BsaInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef(() => {});
  const drag = useRef<{
    field: Input;
    start: number;
    size: number;
    unit: number;
    form: number;
    a: number;
    b: number;
  } | null>(null);
  const pose = props.values ? bsaPose(props.values, props.form) : null;
  useEffect(() => {
    const element = svg.current!;
    const top = [...element.querySelectorAll<SVGGElement>('[data-bsa-group="top"]')];
    const right = [...element.querySelectorAll<SVGGElement>('[data-bsa-group="right"]')];
    const variables = [...element.querySelectorAll<SVGGElement>('[data-bsa-kind]')];
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-bsa-handle]')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current: Values | null = null,
      currentForm = 0,
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
        delete element.dataset.bsaResult;
        if (readout.current)
          readout.current.textContent = 'Bitte gültige Größe und gültiges Gewicht eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      const follow = (a: number, b: number) => {
        const n = reduced.matches ? b : a + (b - a) * (1 - Math.exp(-dt / 0.14));
        const v = Math.abs(n - b) < 0.000001 ? b : n;
        moving ||= v !== b;
        return v;
      };
      for (const field of ['height', 'weight'])
        current[field] = follow(current[field], target[field]);
      currentForm = follow(currentForm, latest.current.form);
      const state = bsaPose(current, currentForm);
      if (!state) return;
      const dz = state.h - art.initialH,
        dx = state.w - art.initialW;
      top.forEach((n) =>
        n.setAttribute('transform', `translate(${dz * art.zVector[0]} ${dz * art.zVector[1]})`),
      );
      right.forEach((n) =>
        n.setAttribute('transform', `translate(${dx * art.xVector[0]} ${dx * art.xVector[1]})`),
      );
      variables.forEach((node) => {
        for (const [name, d] of Object.entries(bsaBox(state, node.dataset.bsaKind!)))
          node.querySelector(`[data-bsa-face="${name}"]`)?.setAttribute('d', d);
      });
      handles.forEach((rect) => {
        const point =
          rect.dataset.bsaHandle === 'height'
            ? bsaPoint(-98 + state.w, -6, 52)
            : bsaPoint(-109, 19, 42 + state.h);
        const radius = (22 * art.width) / element.getBoundingClientRect().width;
        for (const [name, value] of Object.entries({
          x: point[0] - radius,
          y: point[1] - radius,
          width: 2 * radius,
          height: 2 * radius,
        }))
          rect.setAttribute(name, String(value));
      });
      Object.assign(element.dataset, {
        bsaW: String(state.w),
        bsaH: String(state.h),
        bsaArea: String(state.area),
        bsaResult: String(state.result),
        bsaForm: String(state.form),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(state.width, 2)} × ${formatNumber(state.depth, 2)} = ${formatNumber(state.area, 3)} · KOF ${formatNumber(state.result, 2)} m²`;
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
  }, [props.values, props.form]);
  const coordinate = (event: PointerEvent<SVGGElement>, field: Input) => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return field === 'height' ? p.x : p.y;
  };
  const setInput = (field: Input, value: number) => {
    const f = bsaCalculator.fields.find((f) => f.id === field)!;
    latest.current.onInput(field, Math.max(f.min!, Math.min(f.max!, Math.round(value * 10) / 10)));
  };
  return (
    <figure className="bsa-figure iso" data-theme="light">
      <div className="iso-plate bsa-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 18 · Wurzelfenster</span>
          <span>A = s²</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg bsa-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Verstellbares Wurzelfenster: Größe und Gewicht bestimmen ein Rechteck. Beim Formen zum Quadrat bleibt dessen Fläche gleich."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-bsa-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
            >
              {part.kind ? (
                <g
                  className="iso-solid"
                  data-lit={part.kind === 'opening' ? 'true' : undefined}
                  data-bsa-kind={part.kind}
                >
                  {Object.entries(bsaBox(initial, part.kind)).map(([name, d]) => (
                    <path
                      key={name}
                      data-bsa-face={name}
                      d={d}
                      className={
                        name === 'fill'
                          ? 'iso-fill'
                          : name === 'front' || name === 'right'
                            ? 'iso-shade'
                            : name === 'top'
                              ? 'iso-top'
                              : `iso-line ${name === 'outline' ? 'iso-edge' : 'iso-crease'}`
                      }
                      data-shade={name === 'front' ? 2 : name === 'right' ? 0 : undefined}
                      data-tone={name === 'outline' ? 'hi' : 'faint'}
                    />
                  ))}
                </g>
              ) : (
                <g dangerouslySetInnerHTML={{ __html: part.svg }} />
              )}
            </g>
          ))}
          {(['height', 'weight'] as const).map((field) => (
            <g
              key={field}
              className={`bsa-handle bsa-handle-${field}`}
              role="slider"
              tabIndex={pose ? 0 : -1}
              aria-label={`${field === 'height' ? 'Körpergröße' : 'Gewicht'} am Wurzelfenster ändern`}
              aria-orientation={field === 'height' ? 'horizontal' : 'vertical'}
              aria-valuemin={bsaCalculator.fields.find((f) => f.id === field)!.min}
              aria-valuemax={bsaCalculator.fields.find((f) => f.id === field)!.max}
              aria-valuenow={pose?.[field]}
              aria-valuetext={
                pose
                  ? `${formatNumber(pose[field], 1)} ${field === 'height' ? 'cm' : 'kg'}`
                  : undefined
              }
              style={{ display: pose ? undefined : 'none' }}
              onKeyDown={(event) => {
                if (
                  !pose ||
                  !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const f = bsaCalculator.fields.find((f) => f.id === field)!;
                setInput(
                  field,
                  event.key === 'Home'
                    ? f.min!
                    : event.key === 'End'
                      ? f.max!
                      : pose[field] + (['ArrowUp', 'ArrowRight'].includes(event.key) ? 1 : -1),
                );
              }}
              onPointerDown={(event) => {
                if (!pose) return;
                const start = coordinate(event, field);
                if (start === null) return;
                event.preventDefault();
                drag.current = {
                  field,
                  start,
                  size: field === 'height' ? pose.w : pose.h,
                  unit: pose.unit,
                  form: pose.form,
                  a: pose.a,
                  b: pose.b,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const active = drag.current;
                if (!active || active.field !== field) return;
                const c = coordinate(event, field);
                if (c === null) return;
                const size = Math.max(
                  0.000001,
                  (active.size +
                    (c - active.start) / (field === 'height' ? art.xVector[0] : art.zVector[1])) /
                    active.unit,
                );
                const other = field === 'height' ? active.b : active.a;
                setInput(
                  field,
                  60 * (size / other ** (active.form / 2)) ** (1 / (1 - active.form / 2)),
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
              <rect data-bsa-handle={field} width="0" height="0" fill="transparent" rx="5" />
              <title>
                {field === 'height' ? 'Größe horizontal' : 'Gewicht vertikal'} ziehen oder
                Pfeiltasten drücken
              </title>
            </g>
          ))}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Knöpfe ziehen · Pfeiltasten</span>
          <span ref={readout}>
            {pose ? `KOF ${formatNumber(pose.result, 2)} m²` : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Die helle Öffnung ist eine Rechenfläche. Im Quadrat entspricht ihre Seitenlänge dem
        Zahlenwert der KOF. Bei großen Eingaben passt sich der Zeichenmaßstab an.
      </figcaption>
    </figure>
  );
}
