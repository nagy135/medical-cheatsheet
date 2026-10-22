import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Values } from '../calculators';
import { formatNumber } from '../calculators';
import { waterInputs, waterPose } from './water-model';
import { waterPoint, waterBounds, waterSolid } from './water-solid';
import art from './water-art.json';
import { useTouchLock } from './touch';
type Input = (typeof waterInputs)[number];
type Props = {
  values: Values | null;
  onInput: (field: Input, value: number) => void;
  steps: Record<string, number>;
};
export function WaterInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null),
    scaleReadout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  useTouchLock(svg, '.water-handle');
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number } | null>(null);
  const pose = props.values ? waterPose(props.values) : null;
  useEffect(() => {
    const element = svg.current!;
    const fills = Object.fromEntries(
      ['current', 'extra'].map((key) => [
        key,
        element.querySelector<SVGGElement>(`[data-water-group=${key}]`)!,
      ]),
    );
    const rigid = ['witness', 'end'].map((key) => [
      ...element.querySelectorAll<SVGGElement>(`[data-water-group=${key}]`),
    ]);
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-water-handle]')];
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
        delete element.dataset.waterResult;
        if (scaleReadout.current) scaleReadout.current.textContent = '—';

        if (readout.current)
          readout.current.textContent =
            'Bitte Gewicht, Natrium und Körperwasserfaktor gültig eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of waterInputs) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.14));
        current[field] = Math.abs(n - target[field]) < 0.000001 ? target[field] : n;
        moving ||= current[field] !== target[field];
      }
      const state = waterPose(current);
      if (!state) return;
      for (const [key, bounds] of Object.entries(waterBounds(state)))
        fills[key].innerHTML = waterSolid(art, bounds, key === 'extra');
      rigid.forEach((nodes, i) => {
        const delta =
          i === 0
            ? state.currentLength - art.initialCurrentLength
            : state.totalLength - art.initialTotalLength;
        nodes.forEach((node) =>
          node.setAttribute(
            'transform',
            `translate(${delta * art.xVector[0]} ${delta * art.xVector[1]})`,
          ),
        );
      });
      handles.forEach((rect, i) => {
        const p = waterPoint(art, -110 + i * 110, 65, 16.4),
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
        waterWeight: String(state.weight),
        waterSodium: String(state.sodium),
        waterFraction: String(state.bodyWaterFraction),
        waterResult: String(state.result),
        waterTBW: String(state.tbw),
        waterTotal: String(state.total),
        waterUnit: String(state.unit),
        waterCurrentLength: String(state.currentLength),
        waterExtraLength: String(state.extraLength),
        waterTotalLength: String(state.totalLength),
      });
      if (scaleReadout.current) scaleReadout.current.textContent = formatNumber(state.scale, 1);
      if (readout.current)
        readout.current.textContent = `${formatNumber(state.tbw, 1)} + ${formatNumber(state.result, 1)} = ${formatNumber(state.total, 1)} l · Na-Bezug 140`;
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
  const bounds = (field: Input) => ({
    min: field === 'sodium' ? 140 : 0.000001,
    max:
      field === 'weight'
        ? 500
        : field === 'bodyWaterFraction'
          ? 1
          : Math.max(200, latest.current.values?.sodium ?? 200),
  });
  const setInput = (field: Input, value: number) => {
    const { min, max } = bounds(field);
    if (Number.isFinite(value))
      latest.current.onInput(field, Math.max(min, Math.min(max, Number(value.toPrecision(12)))));
  };
  const labels = { weight: 'Gewicht', sodium: 'Natrium', bodyWaterFraction: 'Körperwasserfaktor' };
  return (
    <figure className="water-figure iso" data-theme="light">
      <div className="iso-plate water-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 21 · Verdünnungskammer</span>
          <span>TBW × (Na / 140 − 1)</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg water-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Kalibrierte Verdünnungskammer. Ein grauer Volumeneinsatz steht für geschätztes Körperwasser, die helle Verlängerung für das freie Wasserdefizit. Die Endwand folgt dem Gesamtvolumen."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-water-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {waterInputs.map((field, i) => {
            const p = waterPoint(art, -110 + i * 110, 65, 16.4),
              r = 18;
            return (
              <g
                key={field}
                className="water-handle"
                role="slider"
                tabIndex={pose ? 0 : -1}
                aria-label={`${labels[field]} an der Verdünnungskammer ändern`}
                aria-orientation="vertical"
                aria-valuemin={bounds(field).min}
                aria-valuemax={bounds(field).max}
                aria-valuenow={pose?.[field]}
                aria-valuetext={
                  pose
                    ? `${formatNumber(pose[field], field === 'bodyWaterFraction' ? 2 : 1)} ${field === 'weight' ? 'kg' : field === 'sodium' ? 'mmol/l' : 'l/kg'}`
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
                      ? bounds(field).min
                      : e.key === 'End'
                        ? bounds(field).max
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
                    ((p.y - d.start) / art.zVector[1]) *
                    (field === 'bodyWaterFraction' ? 0.005 : field === 'weight' ? 0.5 : 1);
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
                  data-water-handle={field}
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
          <span>Knöpfe ↕: Gewicht · Natrium · Wasserfaktor</span>
          <span ref={readout}>
            {pose
              ? `Freies Wasserdefizit ${formatNumber(pose.result, 2)} l`
              : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Grau: geschätztes Gesamtkörperwasser. Hell: zusätzliches freies Wasser laut Formel. Beide
        Volumeneinsätze haben denselben Querschnitt und Maßstab. Die Frontmarke zeigt das bisherige
        Körperwasser, die Endwand die Summe. Bei Na 140 verschwindet die helle Verlängerung. Der
        gemeinsame Messbereich ist 0–
        <span ref={scaleReadout}>{pose ? formatNumber(pose.scale, 1) : '—'}</span> l und erweitert
        sich bei großen Volumina.
      </figcaption>
    </figure>
  );
}
