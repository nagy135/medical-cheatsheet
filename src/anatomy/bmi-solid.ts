import type { BmiPose } from './bmi-model';
export type BmiProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const bmiPoint = (P: BmiProjection, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
export function bmiBounds(p: BmiPose) {
  const s = p.side;
  return {
    platen: [-s / 2, -s / 2, 14, s, s, 4],
    load: [-s / 2, -s / 2, 18, s, s, p.thickness],
    follower: [-s / 2, -s / 2, 18 + p.thickness, s, s, 2],
  };
}
const path = (ps: number[][], close = true) =>
  ps.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(5)} ${p[1].toFixed(5)}`).join('') +
  (close ? 'Z' : '');
export function bmiSolid(P: BmiProjection, b: number[], kind: string) {
  const [x, y, z, w, d, h] = b;
  const p = (a: number, c: number, e: number) => bmiPoint(P, x + a * w, y + c * d, z + e * h);
  const top = path([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)]);
  const front = path([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)]);
  const right = path([p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)]);
  const outline = path([p(0, 0, 1), p(1, 0, 1), p(1, 0, 0), p(1, 1, 0), p(0, 1, 0), p(0, 1, 1)]);
  const crease =
    path([p(0, 1, 1), p(1, 1, 1), p(1, 0, 1)], false) + path([p(1, 1, 1), p(1, 1, 0)], false);
  let grid = '';
  if (kind === 'follower')
    for (let i = 1; i < 5; i++)
      grid +=
        path([p(i / 5, 0, 1), p(i / 5, 1, 1)], false) +
        path([p(0, i / 5, 1), p(1, i / 5, 1)], false);
  return `<g class="iso-solid"${kind === 'load' ? ' data-lit="true"' : ''}><path class="iso-fill" d="${outline}"/><path class="iso-shade" data-shade="2" d="${front}"/><path class="iso-shade" data-shade="0" d="${right}"/><path class="iso-top" d="${top}"/><path class="iso-line" data-tone="faint" d="${grid}"/><path class="iso-line iso-crease" data-tone="faint" d="${crease}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/></g>`;
}
