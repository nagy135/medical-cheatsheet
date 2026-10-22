import type { HorovitzPose } from './horovitz-model';
export type HorovitzProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const horovitzPoint = (P: HorovitzProjection, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
export function horovitzBounds(p: HorovitzPose) {
  return {
    oxygen: [-120, 0, 26, p.oxygenWidth, 10, 66],
    rest: [-120 + p.oxygenWidth, 0, 26, 96 - p.oxygenWidth, 10, 66],
    divider: [-121 + p.oxygenWidth, 10, 26, 2, 2, 66],
    pao2: [20, 0, 24, 23, 10, p.heights[0]],
    result: [65, 0, 24, 23, 10, p.heights[1]],
  };
}
const path = (points: number[][], closed = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join('') +
  (closed ? 'Z' : '');
function hull(points: number[][]) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const side = (list: number[][]) => {
    const out: number[][] = [];
    for (const p of list) {
      while (out.length >= 2) {
        const a = out.at(-2)!,
          b = out.at(-1)!;
        if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) > 0) break;
        out.pop();
      }
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...side(sorted), ...side(sorted.reverse())];
}
export function horovitzSolid(P: HorovitzProjection, bounds: number[], lit = false) {
  const [x, y, z, w, d, h] = bounds;
  if (w === 0 || h === 0) return '';
  const p = (a: number, b: number, c: number) => horovitzPoint(P, x + a * w, y + b * d, z + c * h);
  const top = path([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)]),
    front = path([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)]),
    right = path([p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)]);
  const outline = path(
    hull([
      p(0, 0, 0),
      p(0, 1, 0),
      p(0, 0, 1),
      p(0, 1, 1),
      p(1, 0, 0),
      p(1, 1, 0),
      p(1, 0, 1),
      p(1, 1, 1),
    ]),
  );
  const crease =
    path([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0)], false) + path([p(1, 0, 1), p(1, 1, 1)], false);
  return `<g class="iso-solid"${lit ? ' data-lit="true"' : ''}><path class="iso-fill" d="${outline}"/><path class="iso-shade" data-shade="2" d="${front}"/><path class="iso-shade" data-shade="0" d="${right}"/><path class="iso-top" d="${top}"/><path class="iso-line iso-crease" data-tone="faint" d="${crease}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/></g>`;
}
