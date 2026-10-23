export type PbwProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const pbwPoint = (p: PbwProjection, x: number, y: number, z: number) => [
  p.origin[0] + x * p.xVector[0] + y * p.yVector[0] + z * p.zVector[0],
  p.origin[1] + x * p.xVector[1] + y * p.yVector[1] + z * p.zVector[1],
];
const path = (points: number[][]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join('') + 'Z';
/** A true fixed-radius cylinder; only axial volume changes. All six use the identical scale. */
export function pbwMeasure(p: PbwProjection, x: number, y: number, height: number) {
  if (!(height > 0)) return '';
  const z = 14,
    r = 12;
  const point = (angle: number, top: boolean) =>
    pbwPoint(p, x + r * Math.cos(angle), y + r * Math.sin(angle), z + (top ? height : 0));
  // The near half faces positive x/y for the fixed first-quadrant camera.
  const start = Math.atan2(-p.xVector[1], p.yVector[1]);
  const arc = (a: number, b: number, top: boolean, n = 32) =>
    Array.from({ length: n + 1 }, (_, i) => point(a + ((b - a) * i) / n, top));
  const gradient = `pbw-measure-${x.toFixed(4).replace(/[^0-9]/g, 'n')}-${y.toFixed(4).replace(/[^0-9]/g, 'n')}`;
  const center = pbwPoint(p, x, y, z);
  const halfWidth = r * Math.hypot(p.xVector[0], p.yVector[0]);
  let svg = `<defs><linearGradient id="${gradient}" gradientUnits="userSpaceOnUse" x1="${center[0] - halfWidth}" y1="0" x2="${center[0] + halfWidth}" y2="0"><stop stop-color="var(--anatomy-lit-shade)"/><stop offset=".28" stop-color="var(--anatomy-lit-top)"/><stop offset=".63" stop-color="var(--anatomy-lit-shade)"/><stop offset="1" stop-color="var(--anatomy-lit)"/></linearGradient></defs>`;
  for (let i = 0; i < 4; i++) {
    const a = start + (i * Math.PI) / 4,
      b = a + Math.PI / 4;
    const d = path([...arc(a, b, false, 16), ...arc(b, a, true, 16)]);
    svg += `<path class="iso-shade" style="fill:url(#${gradient})" data-shade="${i}" d="${d}"/>`;
  }
  const top = path(arc(0, Math.PI * 2, true, 128));
  const outline = path([
    ...arc(start, start + Math.PI, false, 64),
    ...arc(start + Math.PI, start + Math.PI * 2, true, 64),
  ]);
  return `<g class="iso-solid" data-lit="true"><path class="iso-fill" d="${outline}"/>${svg}<path class="iso-top" d="${top}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/><path class="iso-line" data-tone="lo" d="${top}"/></g>`;
}
