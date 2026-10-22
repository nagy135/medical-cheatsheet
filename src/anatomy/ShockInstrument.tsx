import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Values } from '../calculators';
import { formatNumber } from '../calculators';
import { shockPose } from './shock-model';
import { shockPoint, shockWeight } from './shock-weight';
import art from './shock-art.json';
type Input = 'heartRate' | 'systolic';
type Props = { values: Values | null; onInput: (field: Input, value: number) => void };
export function ShockInstrument(props: Props) {
  const svg = useRef<SVGSVGElement>(null),
    readout = useRef<HTMLSpanElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const wake = useRef(() => {}),
    drag = useRef<{ field: Input; start: number; value: number; scale: number } | null>(null);
  const pose = props.values ? shockPose(props.values) : null;
  useEffect(() => {
    const element = svg.current!;
    const pivot = [...element.querySelectorAll<SVGGElement>('[data-shock-group=pivot]')];
    const caps = [0, 1].map((i) => [
      ...element.querySelectorAll<SVGGElement>(`[data-shock-group=cap${i}]`),
    ]);
    const bodies = [0, 1].map((i) =>
      element.querySelector<SVGGElement>(`[data-shock-group=weight${i}]`)!,
    );
    const handles = [...element.querySelectorAll<SVGRectElement>('[data-shock-handle]')];
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
        delete element.dataset.shockResult;
        if (readout.current)
          readout.current.textContent = 'Bitte gültige Herzfrequenz und gültigen Druck eingeben.';
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
      last = now;
      current ??= { ...target };
      let moving = false;
      for (const field of ['heartRate', 'systolic']) {
        const n = reduced.matches
          ? target[field]
          : current[field] + (target[field] - current[field]) * (1 - Math.exp(-dt / 0.14));
        current[field] =
          Math.abs(n - target[field]) < Math.max(0.000001, Math.abs(target[field]) * 1e-10)
            ? target[field]
            : n;
        moving ||= current[field] !== target[field];
      }
      const state = shockPose(current);
      if (!state) return;
      const dx = state.pivot - art.initialPivot;
      pivot.forEach((n) =>
        n.setAttribute('transform', `translate(${dx * art.xVector[0]} ${dx * art.xVector[1]})`),
      );
      caps.forEach((nodes, i) => {
        const dz = state.heights[i] - art.initialHeights[i];
        nodes.forEach((n) =>
          n.setAttribute('transform', `translate(${dz * art.zVector[0]} ${dz * art.zVector[1]})`),
        );
        bodies[i].innerHTML = shockWeight(art, i, state.heights[i]);
      });
      handles.forEach((rect, i) => {
        const p = shockPoint(art, i === 0 ? -100 : 100, 0, 102 + state.heights[i]),
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
        shockPivot: String(state.pivot),
        shockResult: String(state.result),
        shockLeftArm: String(state.leftArm),
        shockRightArm: String(state.rightArm),
        shockHeartHeight: String(state.heights[0]),
        shockPressureHeight: String(state.heights[1]),
      });
      if (readout.current)
        readout.current.textContent = `Rechter Arm / linker Arm: ${formatNumber(state.rightArm, 2)} / ${formatNumber(state.leftArm, 2)} = ${formatNumber(state.result, 2)}`;
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
    const matrix = svg.current?.getScreenCTM();
    return matrix ? new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse()).y : null;
  };
  const setInput = (field: Input, value: number) => {
    if (Number.isFinite(value))
      latest.current.onInput(field, Math.max(0.000001, Math.round(value)));
  };
  return (
    <figure className="shock-figure iso" data-theme="light">
      <div className="iso-plate shock-plate">
        <div className="anatomy-figure-heading">
          <span>Fig. 14 · Verhältniswaage</span>
          <span>H · a = P · b</span>
        </div>
        <svg
          ref={svg}
          className="iso-svg shock-svg"
          viewBox={`0 0 ${art.width} ${art.height}`}
          role="group"
          aria-label="Zwei Modellgewichte auf einer Waage: Herzfrequenz links, systolischer Druck rechts. Der helle Stützpunkt verschiebt sich, bis beide Hebelwirkungen gleich sind."
        >
          <g dangerouslySetInnerHTML={{ __html: art.halo }} />
          {art.parts.map((part) => (
            <g
              key={part.name}
              data-shock-group={part.group}
              style={part.group === 'static' ? undefined : { display: pose ? undefined : 'none' }}
              dangerouslySetInnerHTML={{ __html: part.svg }}
            />
          ))}
          {(['heartRate', 'systolic'] as const).map((field) => (
            <g
              key={field}
              className="shock-handle"
              role="slider"
              tabIndex={pose ? 0 : -1}
              aria-label={`${field === 'heartRate' ? 'Herzfrequenz' : 'Systolischen Druck'} am Modellgewicht ändern`}
              aria-orientation="vertical"
              aria-valuemin={0.000001}
              aria-valuenow={pose?.[field]}
              aria-valuetext={
                pose
                  ? `${formatNumber(pose[field], 0)} ${field === 'heartRate' ? '/min' : 'mmHg'}`
                  : undefined
              }
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
                drag.current = { field, start: y, value: pose[field], scale: pose.scale };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current,
                  y = yAt(e);
                if (!d || d.field !== field || y === null) return;
                setInput(field, d.value + (((y - d.start) / art.zVector[1]) * d.scale) / 48);
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
              <rect data-shock-handle={field} width="0" height="0" fill="transparent" rx="5" />
              <title>Gewicht vertikal ziehen oder ↑ ↓ drücken</title>
            </g>
          ))}
        </svg>
        <div className="anatomy-figure-footer">
          <span>Gewichtsknöpfe ziehen · ↑ ↓</span>
          <span ref={readout}>
            {pose ? `SI ${formatNumber(pose.result, 2)}` : 'Bitte gültige Werte eingeben.'}
          </span>
        </div>
      </div>
      <figcaption>
        Der helle Stützpunkt wandert zum größeren Modellgewicht. Links liegt H, rechts P. Der rechte
        Hebelarm geteilt durch den linken ergibt H/P.
      </figcaption>
    </figure>
  );
}
