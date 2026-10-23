import type { OsmolalityPose } from './osmolality-model.ts';
import { osmolalityCenters } from './osmolality-model.ts';
export type OsmolalityProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const osmolalityPoint = (P: OsmolalityProjection, x: number, y: number, z: number) => [
  P.origin[0] + x * P.xVector[0] + y * P.yVector[0] + z * P.zVector[0],
  P.origin[1] + x * P.xVector[1] + y * P.yVector[1] + z * P.zVector[1],
];
export type OsmolalityInsert = {
  name: string;
  x: number;
  z: number;
  back: number;
  front: number;
  polygon: number[][];
  lit: boolean;
};
export function osmolalityInserts(p: OsmolalityPose): OsmolalityInsert[] {
  const doses = p.heights.map((h, i) => ({
    name: `dose${i}`,
    x: osmolalityCenters[i],
    z: 46,
    back: -18,
    front: 10,
    polygon: [
      [-5, 0],
      [5, 0],
      [5 + (14 * h) / 64, h],
      [-5 - (14 * h) / 64, h],
    ],
    lit: false,
  }));
  let x = -126;
  const sums = p.lengths.map((length, i) => {
    const insert = {
      name: `sum${i}`,
      x,
      z: 6,
      back: 18,
      front: 40,
      polygon: [
        [0, 0],
        [length, 0],
        [length, 14],
        [0, 14],
      ],
      lit: true,
    };
    x += length;
    return insert;
  });
  return [...doses, ...sums];
}
const path = (points: number[][], closed = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(5)} ${p[1].toFixed(5)}`).join('') +
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
export function osmolalitySolid(P: OsmolalityProjection, b: OsmolalityInsert) {
  const front = b.polygon.map(([x, z]) => osmolalityPoint(P, b.x + x, b.front, b.z + z));
  const back = b.polygon.map(([x, z]) => osmolalityPoint(P, b.x + x, b.back, b.z + z));
  const outline = path(hull([...front, ...back]));
  const right = path([front[1], back[1], back[2], front[2]]),
    top = path([front[2], back[2], back[3], front[3]]);
  const crease =
    path([front[0], front[1], front[2], front[3]], false) + path([front[2], back[2]], false);
  const split =
    b.name === 'sum0'
      ? `<path class="iso-line" data-tone="lo" d="${path([osmolalityPoint(P, b.x + b.polygon[1][0] / 2, b.back, b.z + 14), osmolalityPoint(P, b.x + b.polygon[1][0] / 2, b.front, b.z + 14), osmolalityPoint(P, b.x + b.polygon[1][0] / 2, b.front, b.z)], false)}"/>`
      : '';
  return `<g class="iso-solid"${b.lit ? ' data-lit="true"' : ''}><path class="iso-fill" d="${outline}"/><path class="iso-shade" data-shade="2" d="${path(front)}"/><path class="iso-shade" data-shade="0" d="${right}"/><path class="iso-top" d="${top}"/><path class="iso-line iso-crease" data-tone="faint" d="${crease}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/>${split}</g>`;
}
