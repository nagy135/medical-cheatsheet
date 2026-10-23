import { useEffect, useRef } from 'react';
import { formatNumber } from '../calculators';
import type { Values } from '../calculators';
import { fib4Calculator, fib4Inputs, fib4Pose } from './fib4-model';
import { fib4Bounds, fib4Controls, fib4Point, fib4Solid } from './fib4-solid';
import { useTouchLock } from './touch';
import art from './fib4-art.json';
type Input = (typeof fib4Inputs)[number];
type Props = {
  values: Values | null;
  onInput: (field: Input, value: number) => void;
  steps: Record<string, number>;
};
export function Fib4Instrument(props: Props) {
  const svgRef = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number } | null>(null);
  const pose = props.values ? fib4Pose(props.values) : null;
  useTouchLock(svgRef, '.fib4-handle');
  useEffect(() => {
    const svg = svgRef.current!,
      reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const feelers = fib4Inputs.map((_, i) => [
      ...svg.querySelectorAll<SVGGElement>(`[data-fib4-group=feeler${i}]`),
    ]);
    const bars = Object.fromEntries(
      ['numerator', 'denominator', 'quotient'].map((id) => [
        id,
        svg.querySelector<SVGGElement>(`[data-fib4-group=${id}]`)!,
      ]),
    );
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
        delete svg.dataset.fib4Result;
        if (readout.current) readout.current.textContent = 'Vier gültige Eingaben erforderlich.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      fib4Inputs.forEach((id) => {
        const n = reduced.matches
          ? target[id]
          : current![id] + (target[id] - current![id]) * (1 - Math.exp(-dt / 0.14));
        current![id] =
          Math.abs(n - target[id]) < 1e-7 * Math.max(1, Math.abs(target[id])) ? target[id] : n;
        moving ||= current![id] !== target[id];
      });
      const p = fib4Pose(current, true);
      if (!p) return;
      feelers.forEach((nodes, i) => {
        const dx = p.contacts[i].x - art.initialPositions[i].x,
          dy = p.contacts[i].y - art.initialPositions[i].y,
          dz = p.contacts[i].z - art.initialPositions[i].z;
        nodes.forEach((n) =>
          n.setAttribute(
            'transform',
            `translate(${dx * art.xVector[0] + dy * art.yVector[0] + dz * art.zVector[0]} ${dx * art.xVector[1] + dy * art.yVector[1] + dz * art.zVector[1]})`,
          ),
        );
      });
      for (const [id, b] of Object.entries(fib4Bounds(p)))
        bars[id].innerHTML = fib4Solid(art, b, id === 'quotient');
      Object.assign(svg.dataset, {
        fib4Result: String(p.result),
        fib4Age: String(p.age),
        fib4Ast: String(p.ast),
        fib4Platelets: String(p.platelets),
        fib4Alt: String(p.alt),
        fib4Root: String(p.rootALT),
        fib4NumeratorLength: String(p.numeratorLength),
        fib4DenominatorLength: String(p.denominatorLength),
        fib4QuotientLength: String(p.quotientLength),
        fib4Scale: String(p.quotientMax),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(p.numerator, 1)} / ${formatNumber(p.denominator, 2)} = ${formatNumber(p.result, 2)}`;
      if (moving) run();
    }
    const sizeTargets = () => {
      const r = (22 * art.width) / Math.max(1, svg.getBoundingClientRect().width);
      svg.querySelectorAll<SVGRectElement>('[data-fib4-handle]').forEach((rect, i) => {
        const [x, y] = fib4Controls[i],
          p = fib4Point(art, x, y, 7.6);
        for (const [key, value] of Object.entries({
          x: p[0] - r,
          y: p[1] - r,
          width: 2 * r,
          height: 2 * r,
        }))
          rect.setAttribute(key, String(value));
      });
    };
    const resize = new ResizeObserver(sizeTargets);
    resize.observe(svg);
    sizeTargets();
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
      last = 0;
      run();
    });
    observer.observe(svg);
    const resume = () => {
      last = 0;
      run();
    };
    document.addEventListener('visibilitychange', resume);
    reduced.addEventListener('change', resume);
    return () => {
      resize.disconnect();
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resume);
      reduced.removeEventListener('change', resume);
      wake.current = () => {};
    };
  }, []);
  useEffect(() => {
    if (!props.values) {
      for (const key of Object.keys(svgRef.current!.dataset))
        if (key.startsWith('fib4')) delete svgRef.current!.dataset[key];
      drag.current = null;
    }
    wake.current();
  }, [props.values]);
  const setInput = (field: Input, value: number) => {
    const f = fib4Calculator.fields.find((f) => f.id === field)!;
    const n = Math.max(f.min ?? 0, Math.min(f.max ?? Infinity, value));
    if (Number.isFinite(n))
      latest.current.onInput(field, f.integer ? Math.round(n) : Number(n.toPrecision(12)));
  };
  return (
    <figure className="anatomy-figure fib4-figure iso" data-theme="light">
      <div className="anatomy-plate iso-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 19 · Kurvenkomparator</span>
          <span>Vier Fühler · ein Quotient</span>
        </div>
        <svg
          ref={svgRef}
          className="iso-svg fib4-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="FIB-4 Kurvenkomparator: vier Nockenbahnen mit Fühlern. Die vierte Bahn zieht die Quadratwurzel von ALT. Rechts vergleichen zwei Messzungen Zähler und Nenner."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-fib4-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {fib4Inputs.map((field, i) => {
            const f = fib4Calculator.fields.find((f) => f.id === field)!,
              [x, y] = fib4Controls[i],
              p = fib4Point(art, x, y, 7.6);
            return (
              <g
                key={field}
                className="fib4-handle"
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-label={`${f.label} am Kurvenkomparator ändern`}
                aria-orientation="vertical"
                aria-valuemin={f.min}
                aria-valuemax={f.max}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose ? `${formatNumber(pose[field], f.integer ? 0 : 2)} ${f.unit}` : undefined
                }
                style={{ display: pose ? undefined : 'none' }}
                onKeyDown={(e) => {
                  if (
                    !pose ||
                    !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
                      e.key,
                    )
                  )
                    return;
                  e.preventDefault();
                  setInput(
                    field,
                    e.key === 'Home'
                      ? (f.min ?? 0)
                      : e.key === 'End'
                        ? (f.max ?? pose.domains[field])
                        : pose[field] +
                          (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) * props.steps[field],
                  );
                }}
                onPointerDown={(e) => {
                  if (!pose) return;
                  e.preventDefault();
                  drag.current = { field, start: e.clientY, value: pose[field] };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d || d.field !== field) return;
                  setInput(
                    field,
                    d.value + Math.round((d.start - e.clientY) / 3) * props.steps[field],
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
                  data-fib4-handle={field}
                  x={p[0] - 22}
                  y={p[1] - 22}
                  width="44"
                  height="44"
                  rx="5"
                  fill="transparent"
                />
                <title>{f.label}: vertikal ziehen oder Pfeiltasten verwenden</title>
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Knöpfe ↕: oben Alter · rechts AST · links Thr · unten ALT</span>
          <span ref={readout}>
            {pose ? `FIB-4 ${formatNumber(pose.result, 2)}` : 'Vier gültige Eingaben erforderlich.'}
          </span>
        </div>
      </div>
      <figcaption>
        Vier Nockenbahnen, von links: Alter · AST · Thrombozyten · √ALT. Die ersten drei Fühler
        steigen linear, der vierte folgt der Wurzelkurve. Rechts: zwei breite Messzungen für Zähler
        und Nenner im selben Maßstab, daneben die schmale Quotientenzunge.
      </figcaption>
    </figure>
  );
}
