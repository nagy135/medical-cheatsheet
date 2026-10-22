import art from './map-art.json';
import type { MapPose } from './map-model';

export const mapPoint = (x: number, y: number, z: number) => [
  art.origin[0] + art.xVector[0] * x + art.yVector[0] * y + art.zVector[0] * z,
  art.origin[1] + art.xVector[1] * x + art.yVector[1] * y + art.zVector[1] * z,
];
const path = (points: number[][], closed = true) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('') +
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

export function mapBeam(pose: MapPose, from: number, to: number) {
  const z = (x: number) =>
    pose.heights[0] + ((x + 120) / 240) * (pose.heights[2] - pose.heights[0]);
  const p = (x: number, y: number, h: number) => mapPoint(x, y, z(x) + h);
  const front = [p(from, 14, 0), p(to, 14, 0), p(to, 14, 5), p(from, 14, 5)];
  const top = [p(from, 10, 5), p(to, 10, 5), p(to, 14, 5), p(from, 14, 5)];
  const right = [p(to, 10, 0), p(to, 14, 0), p(to, 14, 5), p(to, 10, 5)];
  const outline = path(
    hull([
      p(from, 10, 0),
      p(from, 14, 0),
      p(from, 10, 5),
      p(from, 14, 5),
      p(to, 10, 0),
      p(to, 14, 0),
      p(to, 10, 5),
      p(to, 14, 5),
    ]),
  );
  let ticks = '';
  for (let x = from + 4; x < to; x += 4)
    ticks += path([p(x, 14, 0), p(x, 14, x % 20 === 0 ? 2.2 : 1.2)], false);
  return {
    fill: outline,
    front: path(front),
    top: path(top),
    right: path(right),
    outline,
    ticks,
    crease:
      path([p(from, 14, 5), p(to, 14, 5), p(to, 14, 0)], false) +
      path([p(to, 10, 5), p(to, 14, 5)], false),
  };
}
