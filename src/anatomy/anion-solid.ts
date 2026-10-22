import type { AnionPose } from './anion-model';
export type AnionProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const anionPoint = (P: AnionProjection, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
export function anionBounds(p: AnionPose) {
  return {
    sodium: [-104, -4, 20, 84, 12, p.heights[0]],
    chloride: [20, -4, 20, 84, 12, p.heights[1]],
    bicarbonate: [20, -4, 20 + p.heights[1], 84, 12, p.heights[2]],
    gap: [-12, 10.4, 20 + p.gapStart, 10, 1, p.gapHeight],
  };
}
const path = (points: number[][], closed = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join('') +
  (closed ? 'Z' : '');
function hull(points: number[][]) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a: number[], b: number[], c: number[]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const side = (list: number[][]) => {
    const out: number[][] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out.at(-2)!, out.at(-1)!, p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...side(sorted), ...side(sorted.reverse())];
}
export function anionSolid(P: AnionProjection, bounds: number[], lit = false) {
  const [x, y, z, w, d, h] = bounds;
  if (h === 0) return '';
  const p = (a: number, b: number, c: number) => anionPoint(P, x + a * w, y + b * d, z + c * h);
  const front = path([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)]),
    right = path([p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)]),
    top = path([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)]);
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
