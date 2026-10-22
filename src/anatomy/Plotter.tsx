import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { calculators, formatNumber } from '../calculators';
import type { Calculator, Field, Values } from '../calculators';
import { numericFieldSettings } from '../numeric-input';
import { inputInterval, resultForPose, traceCurve } from './model';
import art from './plotter-art.json';

type Props = {
  calculator: Calculator;
  values: Values | null;
  axis: Field;
  unitIndex: number;
  touring: boolean;
  onInput: (canonical: number) => void;
};
const point = (x: number, y: number, z = 1.4) => [
  art.origin[0] + art.xVector[0] * x + art.yVector[0] * y + art.zVector[0] * z,
  art.origin[1] + art.xVector[1] * x + art.yVector[1] * y + art.zVector[1] * z,
];
const translate = (x: number, y: number) =>
  `translate(${art.xVector[0] * x + art.yVector[0] * y} ${art.xVector[1] * x + art.yVector[1] * y})`;

export function Plotter(props: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const xScale = useRef<HTMLSpanElement>(null);
  const yScale = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef<() => void>(() => {});
  const dragging = useRef(false);
  const { axis, calculator, unitIndex, values } = props;
  const factor = axis.units?.[unitIndex]?.factor ?? 1;
  const interval = inputInterval(calculator, axis, values?.[axis.id]);

  useEffect(() => {
    const el = svg.current!;
    const trace = el.querySelector<SVGPathElement>('[data-trace]')!;
    const marker = el.querySelector<SVGCircleElement>('[data-marker]')!;
    const gantry = [...el.querySelectorAll<SVGGElement>('[data-moving="gantry"]')];
    const pen = [...el.querySelectorAll<SVGGElement>('[data-moving="pen"]')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current: Values | null = null;
    let frame = 0,
      last = 0,
      phase = 0,
      visible = false;
    const text = (node: HTMLElement | null, value: string) => {
      if (node && node.textContent !== value) node.textContent = value;
    };
    const run = () => {
      if (visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
    };
    function tick(now: number) {
      frame = 0;
      if (!visible || document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      const p = latest.current;
      if (!p.values) {
        trace.setAttribute('d', '');
        marker.style.display = 'none';
        pen.forEach((e) => {
          e.style.display = 'none';
        });
        text(readout.current, 'Am Stift: bitte gültige Werte eingeben.');
        text(xScale.current, 'X: ' + p.axis.label);
        text(yScale.current, 'Y: ' + p.calculator.resultLabel);
        current = null;
        return;
      }
      current ??= { ...p.values };
      let moving = false;
      const target = { ...p.values };
      if (p.touring && !reduced.matches) {
        phase += dt * 0.55;
        const domain = inputInterval(p.calculator, p.axis, target[p.axis.id]);
        target[p.axis.id] = domain[0] + (domain[1] - domain[0]) * (0.5 + 0.48 * Math.sin(phase));
      }
      for (const field of p.calculator.fields) {
        const want = target[field.id];
        const next =
          reduced.matches || field.options
            ? want
            : current[field.id] + (want - current[field.id]) * (1 - Math.exp(-dt / 0.15));
        moving ||= Math.abs(next - want) > 0.00001;
        current[field.id] = Math.abs(next - want) < 0.00001 ? want : next;
      }
      const pose = Object.fromEntries(
        p.calculator.fields.map((f) => [
          f.id,
          f.integer ? Math.round(current![f.id]) : current![f.id],
        ]),
      );
      const curve = traceCurve(p.calculator, pose, p.axis);
      const xy = (x: number, y: number) => [
        -105 + (210 * (x - curve.x[0])) / (curve.x[1] - curve.x[0]),
        50 - (100 * (y - curve.y[0])) / (curve.y[1] - curve.y[0]),
      ];
      let d = '',
        open = false;
      for (const sample of curve.points) {
        if (sample.result === null) {
          open = false;
          continue;
        }
        const world = xy(sample.x, sample.result);
        const screen = point(world[0], world[1]);
        d += `${open ? 'L' : 'M'}${screen[0].toFixed(2)} ${screen[1].toFixed(2)}`;
        open = true;
      }
      trace.setAttribute('d', d);
      const result = resultForPose(p.calculator, pose);
      if (result === null) {
        marker.style.display = 'none';
        pen.forEach((e) => {
          e.style.display = 'none';
        });
        text(readout.current, 'Am Stift: außerhalb des gültigen Formelbereichs.');
      } else {
        const world = xy(pose[p.axis.id], result),
          screen = point(world[0], world[1]);
        gantry.forEach((e) => e.setAttribute('transform', translate(0, world[1] - 8)));
        pen.forEach((e) => {
          e.style.display = '';
          e.setAttribute('transform', translate(world[0], world[1] - 8));
        });
        marker.style.display = '';
        marker.setAttribute('cx', String(screen[0]));
        marker.setAttribute('cy', String(screen[1]));
        const unit = p.axis.units?.[p.unitIndex]?.label ?? p.axis.unit ?? '';
        const conversion = p.axis.units?.[p.unitIndex]?.factor ?? 1;
        text(
          readout.current,
          `Am Stift: ${formatNumber(pose[p.axis.id] / conversion, p.axis.integer ? 0 : 2)} ${unit} → ${formatNumber(result, p.calculator.precision)} ${p.calculator.resultUnit}`,
        );
      }
      const conversion = p.axis.units?.[p.unitIndex]?.factor ?? 1;
      const unit = p.axis.units?.[p.unitIndex]?.label ?? p.axis.unit ?? '';
      text(
        xScale.current,
        `X · ${p.axis.label}: ${formatNumber(curve.x[0] / conversion, 2)} – ${formatNumber(curve.x[1] / conversion, 2)} ${unit}`,
      );
      text(
        yScale.current,
        `Y · ${p.calculator.abbreviation}: ${formatNumber(curve.y[0], 2)} – ${formatNumber(curve.y[1], 2)} ${p.calculator.resultUnit}`,
      );
      if (moving || (p.touring && !reduced.matches)) run();
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
    observer.observe(el);
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
  }, [props.values, props.axis, props.unitIndex, props.touring]);

  const inputAt = (event: PointerEvent<SVGSVGElement>) => {
    const p = latest.current,
      matrix = svg.current?.getScreenCTM();
    if (!matrix || !p.values) return;
    const screen = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const base = point(0, 0);
    const sx = screen.x - base[0],
      sy = screen.y - base[1];
    const determinant = art.xVector[0] * art.yVector[1] - art.yVector[0] * art.xVector[1];
    const x = (sx * art.yVector[1] - sy * art.yVector[0]) / determinant;
    const domain = inputInterval(p.calculator, p.axis, p.values[p.axis.id]);
    const value = domain[0] + Math.min(1, Math.max(0, (x + 105) / 210)) * (domain[1] - domain[0]);
    p.onInput(p.axis.integer ? Math.round(value) : Number(value.toPrecision(8)));
  };

  return (
    <figure className="anatomy-figure iso" data-theme="light">
      <div className="iso-plate anatomy-plate">
        <div className="anatomy-figure-heading">
          <span>
            Fig. {String(calculators.findIndex((c) => c.id === calculator.id) + 1).padStart(2, '0')}
          </span>
          <span>Kurvenschreiber · {calculator.abbreviation}</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg anatomy-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="slider"
          tabIndex={0}
          aria-label={`Kurvenschreiber: ${axis.label}. Links und rechts ändern den Wert; auch auf dem Zeichenblatt ziehen.`}
          aria-valuemin={interval[0] / factor}
          aria-valuemax={interval[1] / factor}
          aria-valuenow={values ? values[axis.id] / factor : interval[0] / factor}
          onKeyDown={(event) => {
            if (!values || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const step = numericFieldSettings(axis, unitIndex).step * factor;
            const value =
              event.key === 'Home'
                ? interval[0]
                : event.key === 'End'
                  ? interval[1]
                  : values[axis.id] + (event.key === 'ArrowLeft' ? -step : step);
            props.onInput(Math.max(interval[0], Math.min(interval[1], value)));
          }}
          onPointerDown={(event) => {
            if (!values) return;
            event.preventDefault();
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            inputAt(event);
          }}
          onPointerMove={(event) => {
            if (dragging.current) inputAt(event);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          onLostPointerCapture={() => {
            dragging.current = false;
          }}
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g key={part.name}>
              <g
                data-moving={part.group}
                data-art={part.name}
                dangerouslySetInnerHTML={{ __html: part.svg }}
              />
              {part.name === 'paper' && (
                <g>
                  <path data-trace className="anatomy-trace" d="" />
                  <circle
                    data-marker
                    className="anatomy-marker"
                    r="2.4"
                    style={{ display: 'none' }}
                  />
                </g>
              )}
            </g>
          ))}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Auf dem Papier ziehen · ← →</span>
          <span ref={readout} data-pen-readout>
            Am Stift: …
          </span>
        </div>
      </div>
      <figcaption className="anatomy-scales">
        <span ref={xScale} />
        <span ref={yScale} />
        <small>
          Andere Eingaben bleiben für die Kurve konstant. Skalen passen sich an; keine klinischen
          Referenzbereiche.
        </small>
      </figcaption>
    </figure>
  );
}
