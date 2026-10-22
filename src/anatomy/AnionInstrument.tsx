import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { formatNumber } from '../calculators';
import type { Values } from '../calculators';
import { anionInputs, anionPose } from './anion-model';
import { anionBounds, anionPoint, anionSolid } from './anion-solid';
import art from './anion-art.json';
type Input = (typeof anionInputs)[number];
type Props = { values: Values | null; onInput: (field: Input, value: number) => void };
export function AnionInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number; unit: number } | null>(null);
  const pose = props.values ? anionPose(props.values) : null;
  useEffect(() => {
    const element = svg.current!;
    const inputs = [0, 1, 2].map((i) => [
      ...element.querySelectorAll<SVGGElement>(`[data-anion-group=input${i}]`),
    ]);
    const bodies = ['sodium', 'chloride', 'bicarbonate', 'gap'].map((key) =>
      element.querySelector<SVGGElement>(`[data-anion-group=${key}]`)!,
    );
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-anion-handle]')];
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
        delete element.dataset.anionResult;
        if (readout.current) readout.current.textContent = 'Bitte alle drei Werte gültig eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of anionInputs) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.14));
        current[field] =
          Math.abs(n - target[field]) < Math.max(0.000001, Math.abs(target[field]) * 1e-10)
            ? target[field]
            : n;
        moving ||= current[field] !== target[field];
      }
      const state = anionPose(current);
      if (!state) return;
      const stops = [state.heights[0], state.heights[1], state.totalHeight];
      inputs.forEach((nodes, i) => {
        const dz = stops[i] - art.initialStops[i];
        nodes.forEach((n) =>
          n.setAttribute('transform', `translate(${dz * art.zVector[0]} ${dz * art.zVector[1]})`),
        );
      });
      Object.entries(anionBounds(state)).forEach(([key, bounds], i) => {
        bodies[i].innerHTML = anionSolid(art, bounds, key === 'gap');
      });
      handles.forEach((rect, i) => {
        const p = anionPoint(art, [-115, 8, 115][i], 20, 20 + stops[i]),
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
        anionResult: String(state.result),
        anionSign: String(state.sign),
        anionSodiumHeight: String(state.heights[0]),
        anionChlorideHeight: String(state.heights[1]),
        anionBicarbonateHeight: String(state.heights[2]),
        anionTotalHeight: String(state.totalHeight),
        anionGapHeight: String(state.gapHeight),
      });
      if (readout.current)
        readout.current.textContent = `${formatNumber(state.sodium, 1)} − ${formatNumber(state.chloride, 1)} − ${formatNumber(state.bicarbonate, 1)} = ${formatNumber(state.result, 1)} mmol/l`;
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
        Math.max(0.000001, value < Number.MAX_VALUE / 10 ? Math.round(value * 10) / 10 : value),
      );
  };
  return (
    <figure className="anion-figure iso" data-theme="light">
      <div className="iso-plate anion-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 07 · Bilanzschrank</span>
          <span>Na − Cl − HCO₃</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg anion-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Bilanzschrank: links Natrium, rechts Chlorid unten und Bikarbonat darüber. Der helle Streifen markiert den Höhenunterschied ihrer oberen Kanten."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-anion-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {anionInputs.map((field) => (
            <g
              key={field}
              className="anion-handle"
              role="slider"
              tabIndex={pose ? 0 : -1}
              aria-label={`${field === 'sodium' ? 'Natrium' : field === 'chloride' ? 'Chlorid' : 'Bikarbonat'} am Bilanzschrank ändern`}
              aria-orientation="vertical"
              aria-valuemin={0.000001}
              aria-valuenow={pose?.[field]}
              aria-valuetext={pose ? `${formatNumber(pose[field], 1)} mmol/l` : undefined}
              style={{ display: pose ? undefined : 'none' }}
              onKeyDown={(e) => {
                if (!pose || !['ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
                e.preventDefault();
                setInput(
                  field,
                  e.key === 'Home' ? 0.000001 : pose[field] + (e.key === 'ArrowUp' ? 1 : -1),
                );
              }}
              onPointerDown={(e) => {
                if (!pose) return;
                const y = yAt(e);
                if (y === null) return;
                e.preventDefault();
                drag.current = { field, start: y, value: pose[field], unit: pose.unit };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current,
                  y = yAt(e);
                if (!d || d.field !== field || y === null) return;
                setInput(field, d.value + (y - d.start) / art.zVector[1] / d.unit);
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
              <rect data-anion-handle={field} width="0" height="0" fill="transparent" rx="5" />
              <title>Knopf vertikal ziehen oder ↑ ↓ drücken</title>
            </g>
          ))}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Drei Knöpfe ziehen · ↑ ↓</span>
          <span ref={readout}>
            {pose ? `AG ${formatNumber(pose.result, 1)} mmol/l` : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Links: Na⁺. Rechts: Cl⁻ unten, HCO₃⁻ oben. Der helle Streifen verbindet die beiden oberen
        Kanten; seine Länge zeigt den Betrag der Differenz.
      </figcaption>
    </figure>
  );
}
