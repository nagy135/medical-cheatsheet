import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Values } from '../calculators';
import { formatNumber } from '../calculators';
import { bazettInputs, bazettPose } from './bazett-model';
import { bazettPoint, bazettShapes, bazettSolid, bazettTicks } from './bazett-solid';
import art from './bazett-art.json';
import { useTouchLock } from './touch';
type Input = (typeof bazettInputs)[number];
type Props = { values: Values | null; onInput: (field: Input, value: number) => void };
export function BazettInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  useTouchLock(svg, '.bazett-handle');
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number } | null>(null);
  const pose = props.values ? bazettPose(props.values) : null;
  useEffect(() => {
    const element = svg.current!;
    const hands = Object.fromEntries(
      ['qt', 'corrected', 'witness'].map((key) => [
        key,
        element.querySelector<SVGGElement>(`[data-bazett-group=${key}]`)!,
      ]),
    );
    const rivets = [0, 1, 2, 3].map((i) =>
      element.querySelector<SVGGElement>(`[data-bazett-group=rivet${i}]`)!,
    );
    const outer = element.querySelector<SVGGElement>('[data-bazett-ticks=outer]')!,
      inner = element.querySelector<SVGGElement>('[data-bazett-ticks=inner]')!;
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-bazett-handle]')];
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
        delete element.dataset.bazettResult;
        inner.innerHTML = '';
        outer.innerHTML = '';
        if (readout.current)
          readout.current.textContent = 'Bitte QT und Herzfrequenz gültig eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of bazettInputs) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.14));
        current[field] = Math.abs(n - target[field]) < 0.000001 ? target[field] : n;
        moving ||= current[field] !== target[field];
      }
      const state = bazettPose(current);
      if (!state) return;
      for (const [key, shape] of Object.entries(bazettShapes(state)))
        hands[key].innerHTML = bazettSolid(art, shape, key === 'corrected');
      outer.innerHTML = bazettTicks(art, state);
      inner.innerHTML = bazettTicks(art, state, true);
      rivets.forEach((node, i) => {
        const a = (i * Math.PI) / 2,
          dx = 43 * (Math.cos(a + state.gainAngle) - Math.cos(a + art.initialGainAngle)),
          dy = 43 * (Math.sin(a + state.gainAngle) - Math.sin(a + art.initialGainAngle));
        node.setAttribute(
          'transform',
          `translate(${dx * art.xVector[0] + dy * art.yVector[0]} ${dx * art.xVector[1] + dy * art.yVector[1]})`,
        );
      });
      handles.forEach((rect, i) => {
        const p = bazettPoint(art, i === 0 ? -112 : 112, 65, 18),
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
        bazettQT: String(state.qt),
        bazettHeartRate: String(state.heartRate),
        bazettResult: String(state.result),
        bazettRR: String(state.rr),
        bazettGain: String(state.gain),
        bazettQTAngle: String(state.qtAngle),
        bazettGainAngle: String(state.gainAngle),
        bazettResultAngle: String(state.resultAngle),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(state.qt, 0)} × ${formatNumber(state.gain, 3)} = ${formatNumber(state.result, 0)} ms · RR ${formatNumber(state.rr, 3)} s`;
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
  const yAt = (e: PointerEvent<SVGGElement>) => {
    const m = svg.current?.getScreenCTM();
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).y : null;
  };
  const setInput = (field: Input, value: number) => {
    if (Number.isFinite(value))
      latest.current.onInput(
        field,
        Math.max(0.000001, Math.min(field === 'qt' ? 1500 : 350, Math.round(value))),
      );
  };
  return (
    <figure className="bazett-figure iso" data-theme="light">
      <div className="iso-plate bazett-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 15 · Bazett-Scheibe</span>
          <span>QT × 1/√RR</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg bazett-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Kreisrechenschieber: QT setzt den grauen Zeiger, die Herzfrequenz dreht die RR-Skala. Der helle Zeiger zeigt QTc auf der festen Außenskala."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-bazett-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {bazettInputs.map((field, i) => {
            const p = bazettPoint(art, i === 0 ? -112 : 112, 65, 18),
              r = 18;
            return (
              <g
                key={field}
                className="bazett-handle"
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-label={`${field === 'qt' ? 'QT-Intervall' : 'Herzfrequenz'} an der Bazett-Scheibe ändern`}
                aria-orientation="vertical"
                aria-valuemin={0.000001}
                aria-valuemax={field === 'qt' ? 1500 : 350}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose
                    ? `${formatNumber(pose[field], 0)} ${field === 'qt' ? 'ms' : '/min'}`
                    : undefined
                }
                style={{ display: pose ? undefined : 'none' }}
                onKeyDown={(e) => {
                  if (!pose || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
                  e.preventDefault();
                  setInput(
                    field,
                    e.key === 'Home'
                      ? 0.000001
                      : e.key === 'End'
                        ? field === 'qt'
                          ? 1500
                          : 350
                        : pose[field] + (e.key === 'ArrowUp' ? 1 : -1),
                  );
                }}
                onPointerDown={(e) => {
                  if (!pose) return;
                  const y = yAt(e);
                  if (y === null) return;
                  e.preventDefault();
                  drag.current = { field, start: y, value: pose[field] };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    y = yAt(e);
                  if (!d || d.field !== field || y === null) return;
                  setInput(
                    field,
                    d.value + ((y - d.start) / art.zVector[1]) * (field === 'qt' ? 5 : 1),
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
                  data-bazett-handle={field}
                  x={p[0] - r}
                  y={p[1] - r}
                  width={2 * r}
                  height={2 * r}
                  fill="transparent"
                  rx="5"
                />
                <title>Knopf vertikal ziehen oder ↑ ↓ drücken</title>
              </g>
            );
          })}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Links Herzfrequenz · rechts QT · Knöpfe ziehen</span>
          <span ref={readout}>
            {pose ? `QTc ${formatNumber(pose.result, 0)} ms` : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Grau: QT. Hell: QTc. Die Scheibe verschiebt die Richtung um den Faktor 1/√RR. Logarithmische
        Skalen: Gleiche Winkelabstände entsprechen gleichen Faktoren. Bezugsrichtung: 400 ms; der
        Skalenausschnitt passt sich bei großen Abständen an.
      </figcaption>
    </figure>
  );
}
