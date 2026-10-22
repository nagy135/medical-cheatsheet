import type { BazettPose } from './bazett-model';
export type BazettProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const bazettPoint = (P: BazettProjection, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
export const rotate = (points: number[][], angle: number) =>
  points.map(([x, y]) => [
    x * Math.cos(angle) - y * Math.sin(angle),
    x * Math.sin(angle) + y * Math.cos(angle),
  ]);
export function bazettShapes(p: BazettPose) {
  return {
    qt: {
      points: rotate(
        [
          [-5, -4],
          [5, -4],
          [68, 0],
          [5, 4],
          [-5, 4],
        ],
        p.qtAngle,
      ),
      z: 25,
      h: 2,
    },
    corrected: {
      points: rotate(
        [
          [-6, -5],
          [6, -5],
          [79, 0],
          [6, 5],
          [-6, 5],
        ],
        p.resultAngle,
      ),
      z: 31,
      h: 2,
    },
    witness: {
      points: rotate(
        [
          [48, -1.5],
          [55, -1.5],
          [55, 1.5],
          [48, 1.5],
        ],
        p.gainAngle,
      ),
      z: 17.7,
      h: 2,
    },
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
export function bazettSolid(
  P: BazettProjection,
  shape: { points: number[][]; z: number; h: number },
  lit = false,
) {
  const { points, z, h } = shape;
  const low = points.map(([x, y]) => bazettPoint(P, x, y, z)),
    top = points.map(([x, y]) => bazettPoint(P, x, y, z + h));
  const outline = path(hull([...low, ...top]));
  let sides = '';
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length,
      dx = points[j][0] - points[i][0],
      dy = points[j][1] - points[i][1],
      len = Math.hypot(dx, dy),
      nx = dy / len,
      ny = -dx / len;
    if (nx + ny <= 0) continue; // This figure's camera azimuth is 45°.
    const shade = Math.min(3, Math.max(0, Math.floor((1 + (-nx + ny) / Math.SQRT2) * 2)));
    sides += `<path class="iso-shade" data-shade="${shade}" d="${path([low[i], low[j], top[j], top[i]])}"/>`;
  }
  return `<g class="iso-solid"${lit ? ' data-lit="true"' : ''}><path class="iso-fill" d="${outline}"/>${sides}<path class="iso-top" d="${path(top)}"/><path class="iso-line iso-crease" data-tone="faint" d="${path(top)}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/></g>`;
}
export function bazettTicks(P: BazettProjection, pose: BazettPose, rotor = false) {
  const radius = rotor ? 57 : 82,
    z = rotor ? 17.7 : 15.7,
    offset = rotor ? pose.gainAngle : 0;
  const step = Math.LN2 / 4,
    limit = Math.ceil(((120 * Math.PI) / 180 + Math.abs(offset)) / pose.k / step) + 1;
  let out = '';
  for (let n = -limit; n <= limit; n++) {
    const angle = pose.k * n * step + offset;
    if (Math.abs(angle) >= (120 * Math.PI) / 180) continue;
    const opacity = Math.min(1, (120 - (Math.abs(angle) * 180) / Math.PI) / 10);
    const length = n % 4 === 0 ? 4 : n % 2 === 0 ? 3 : 2;
    const p = (r: number) => bazettPoint(P, r * Math.cos(angle), r * Math.sin(angle), z);
    out += `<path class="iso-line" opacity="${opacity}" data-tone="${n === 0 ? 'hi' : n % 4 === 0 ? 'mid' : 'lo'}" d="${path([p(radius), p(radius - length)], false)}"/>`;
  }
  return out;
}
