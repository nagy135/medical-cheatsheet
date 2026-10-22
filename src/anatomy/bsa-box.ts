import art from './bsa-art.json';
import type { BsaPose } from './bsa-model';

export const bsaPoint = (x: number, y: number, z: number) => [
  art.origin[0] + art.xVector[0] * x + art.yVector[0] * y + art.zVector[0] * z,
  art.origin[1] + art.xVector[1] * x + art.yVector[1] * y + art.zVector[1] * z,
];
const path = (points: number[][], closed = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(3)} ${p[1].toFixed(3)}`).join('') +
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
export function bsaBox(pose: BsaPose, kind: string) {
  const bounds: Record<string, number[]> = {
    opening: [-100, -1, 40, pose.w, 1, pose.h],
    rightJaw: [-100 + pose.w, 0, 40, 5, 8, pose.h],
    topJaw: [-100, 0, 40 + pose.h, pose.w + 5, 8, 6],
    tongue: [-100 + pose.w, -2, 40, 5, 2, Math.min(4, pose.h)],
  };
  const [x, y, z, w, d, h] = bounds[kind];
  const p = (a: number, b: number, c: number) => bsaPoint(x + a * w, y + b * d, z + c * h);
  const front = [p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)];
  const right = [p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)];
  const top = [p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)];
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
  return {
    fill: outline,
    front: path(front),
    right: path(right),
    top: path(top),
    outline,
    crease:
      path([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0)], false) + path([p(1, 0, 1), p(1, 1, 1)], false),
  };
}
