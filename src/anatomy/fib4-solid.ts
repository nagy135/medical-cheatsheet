import type { Fib4Pose } from './fib4-model';
export type Fib4Projection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const fib4Point = (P: Fib4Projection, x: number, y: number, z: number) => [
  P.origin[0] + x * P.xVector[0] + y * P.yVector[0] + z * P.zVector[0],
  P.origin[1] + x * P.xVector[1] + y * P.yVector[1] + z * P.zVector[1],
];
export const fib4Controls = [
  [-149, -72],
  [149, -72],
  [-149, 75],
  [149, 75],
];
export const fib4Bounds = (p: Fib4Pose) => ({
  numerator: [78, -50, 6, 10, p.numeratorLength, 4],
  denominator: [98, -50, 6, 10, p.denominatorLength, 4],
  quotient: [127, -50, 6, 6, p.quotientLength, 4],
});
const path = (ps: number[][], closed = true) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join('') +
  (closed ? 'Z' : '');
export function fib4Solid(P: Fib4Projection, b: number[], lit = false) {
  const [x, y, z, w, d, h] = b;
  if (!w || !d || !h) return '';
  const p = (a: number, c: number, e: number) => fib4Point(P, x + a * w, y + c * d, z + e * h);
  const corners = [
    p(0, 0, 0),
    p(1, 0, 0),
    p(0, 1, 0),
    p(1, 1, 0),
    p(0, 0, 1),
    p(1, 0, 1),
    p(0, 1, 1),
    p(1, 1, 1),
  ].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const side = (list: number[][]) => {
    const out: number[][] = [];
    for (const point of list) {
      while (out.length >= 2) {
        const a = out.at(-2)!,
          b = out.at(-1)!;
        if ((b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]) > 0) break;
        out.pop();
      }
      out.push(point);
    }
    return out.slice(0, -1);
  };
  const outline = path([...side(corners), ...side([...corners].reverse())]);
  return `<g class="iso-solid"${lit ? ' data-lit="true"' : ''}><path class="iso-fill" d="${outline}"/><path class="iso-shade" data-shade="2" d="${path([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)])}"/><path class="iso-shade" data-shade="0" d="${path([p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)])}"/><path class="iso-top" d="${path([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)])}"/><path class="iso-line iso-crease" data-tone="faint" d="${path([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0)], false) + path([p(1, 0, 1), p(1, 1, 1)], false)}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/></g>`;
}
