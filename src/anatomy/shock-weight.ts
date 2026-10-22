// The same projected cylinder faces are used at build time and in the live figure.
export type Projection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const shockPoint = (P: Projection, x: number, y: number, z: number) => [
  P.origin[0] + P.xVector[0] * x + P.yVector[0] * y + P.zVector[0] * z,
  P.origin[1] + P.xVector[1] * x + P.yVector[1] * y + P.zVector[1] * z,
];
const path = (points: number[][]) =>
  points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(4)} ${p[1].toFixed(4)}`).join('') + 'Z';
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
export function shockWeight(P: Projection, index: number, height: number) {
  const x = index === 0 ? -100 : 100,
    z = 98,
    r = 11,
    steps = 64,
    az = (60 * Math.PI) / 180;
  const p = (t: number, h: number) => shockPoint(P, x + r * Math.cos(t), r * Math.sin(t), z + h);
  const top = Array.from({ length: steps }, (_, i) => p((i * 2 * Math.PI) / steps, height));
  const bottom = Array.from({ length: steps }, (_, i) => p((i * 2 * Math.PI) / steps, 0));
  const outline = path(hull([...top, ...bottom]));
  let sides = '';
  for (let i = 0; i < steps; i++) {
    const a = (i * 2 * Math.PI) / steps,
      b = ((i + 1) * 2 * Math.PI) / steps,
      m = (a + b) / 2;
    if (Math.cos(m) * Math.sin(az) + Math.sin(m) * Math.cos(az) <= 0) continue;
    const shade = Math.min(
      3,
      Math.max(0, Math.floor((1 - Math.cos(m) * Math.sin(az) + Math.sin(m) * Math.cos(az)) * 2)),
    );
    sides += `<path class="iso-shade" data-shade="${shade}" d="${path([p(a, 0), p(b, 0), p(b, height), p(a, height)])}"/>`;
  }
  return `<g class="iso-solid"><path class="iso-fill" d="${outline}"/>${sides}<path class="iso-top" d="${path(top)}"/><path class="iso-line iso-crease" data-tone="faint" d="${path(top)}"/><path class="iso-line iso-edge" data-tone="hi" d="${outline}"/></g>`;
}
