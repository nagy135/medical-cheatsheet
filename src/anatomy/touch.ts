import { useEffect } from 'react';
import type { RefObject } from 'react';

// Keeps a finger that grabs a control from also scrolling the page. CSS touch-action on SVG
// children is ignored by iOS Safari and React registers touch listeners as passive, so the
// scroll has to be cancelled with native non-passive listeners. Omit `selector` to lock the
// whole SVG.
export function useTouchLock(svg: RefObject<SVGSVGElement | null>, selector?: string) {
  useEffect(() => {
    const element = svg.current!;
    let held = false;
    const start = (e: TouchEvent) => {
      held = !selector || !!(e.target as Element).closest(selector);
      if (held && e.cancelable) e.preventDefault();
    };
    const move = (e: TouchEvent) => {
      if (held && e.cancelable) e.preventDefault();
    };
    const end = (e: TouchEvent) => {
      if (!e.touches.length) held = false;
    };
    element.addEventListener('touchstart', start, { passive: false });
    element.addEventListener('touchmove', move, { passive: false });
    element.addEventListener('touchend', end);
    element.addEventListener('touchcancel', end);
    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchcancel', end);
    };
  }, [svg, selector]);
}
