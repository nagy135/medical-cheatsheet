// The same vendored geometry builders draw the live mechanism and its audited build.
// @ts-expect-error Vendored JavaScript kit has no declaration file.
import * as k from '../../docs/anatomy-map/vendor/iso-kit.mjs';
// @ts-expect-error Vendored JavaScript lathe has no declaration file.
import * as G from '../../docs/anatomy-map/vendor/lathe.mjs';
import type { SodiumPose } from './sodium-model.ts';
export type SodiumProjection = {
  origin: number[];
  xVector: number[];
  yVector: number[];
  zVector: number[];
};
export const sodiumPoint = (P: SodiumProjection, x: number, y: number, z: number) =>
  [0, 1].map((i) => P.origin[i] + x * P.xVector[i] + y * P.yVector[i] + z * P.zVector[i]);
type Frame = { o: number[]; a: number[]; u: number[]; v: number[] };
export type SodiumPart = { name: string; svg: string; shape: object; at: number[] };
export function sodiumMechanism(P: unknown, p: SodiumPose): SodiumPart[] {
  const parts: SodiumPart[] = [];
  const F: Frame = { o: [0, -8, 0], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
  const add = (name: string, at: number[], svg: string, shape: object) =>
    parts.push({ name, at, svg, shape: { ...shape, name } });
  const slab = (
    name: string,
    x: number,
    y: number,
    w: number,
    d: number,
    z: number,
    h: number,
    inner = '',
    lit = false,
  ) => {
    const plan = { x, y, w, d, r: 0 };
    add(
      name,
      [x + w / 2, y + d / 2, z + h / 2],
      k.solidSvg(k.slabOf(plan, z, h, P, 4, 0), { inner, lit }),
      {
        kind: 'prism',
        F: { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
        poly: [
          [x, y],
          [x + w, y],
          [x + w, y + d],
          [x, y + d],
        ],
        s0: z,
        s1: z + h,
      },
    );
  };
  const prism = (
    name: string,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
    t0: number,
    t1: number,
    lit = false,
    inner = '',
  ) => {
    const poly = [
      [x0, z0],
      [x1, z1],
      [x1, t1],
      [x0, t0],
    ];
    const frame = { ...F, o: [0, y0, 0] };
    const svg = k.solidSvg(G.prismOf(frame, poly, 0, y1 - y0, P), { lit, inner });
    add(name, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1 + t0 + t1) / 4], svg, {
      kind: 'prism',
      F: frame,
      poly,
      s0: 0,
      s1: y1 - y0,
    });
  };
  const halfBearing = (
    name: string,
    frame: Frame,
    a: number,
    b: number,
    inner: number,
    outer: number,
  ) => {
    const V = G.viewOf(P),
      angle = Math.atan2(G.dot3(frame.v, V), G.dot3(frame.u, V));
    for (const [i, center] of [angle, angle + Math.PI].entries()) {
      const angles = Array.from(
        { length: 33 },
        (_, j) => center - Math.PI / 2 + (j * Math.PI) / 32,
      );
      const poly = [
        ...angles.map((t) => [outer * Math.cos(t), outer * Math.sin(t)]),
        ...[...angles].reverse().map((t) => [inner * Math.cos(t), inner * Math.sin(t)]),
      ];
      const geometry = G.prismOf(frame, poly, a, b, P);
      geometry.fill = [...geometry.shades, geometry.top].join('');
      geometry.outline = '';
      add(
        `${name}.${i}`,
        frame.o.map((n, j) => n + (frame.a[j] * (a + b)) / 2),
        k.solidSvg(geometry),
        { kind: 'prism', F: frame, poly, s0: a, s1: b },
      );
    }
  };
  const screw = (
    name: string,
    frame: Frame,
    a: number,
    b: number,
    r: number,
    hole = 0,
    ribs = 0,
    lit = false,
  ) => {
    let inner = ribs
      ? k.fadedSvg(G.ribsOf(frame, a, b, r, ribs, P, { seams: true, fade: [0.05, 0.5] }), {
          tone: 'lo',
        })
      : '';
    if (name.startsWith('drive.shaft')) {
      const pitch = 4.5,
        phase = p.travel % pitch,
        theta = G.angleToward(frame, G.viewOf(P));
      let d = '';
      for (let start = Math.floor((a - phase) / pitch) * pitch + phase; start < b; start += pitch) {
        const from = Math.max(0, ((a - start) / pitch) * 2),
          to = Math.min(1, ((b - start) / pitch) * 2);
        if (to <= from) continue;
        const points = Array.from({ length: 17 }, (_, i) => {
          const t = from + ((to - from) * i) / 16;
          return k.iso(
            G.pointOf(frame, start + (pitch * t) / 2, r, theta - Math.PI / 2 + Math.PI * t),
            P,
          );
        });
        d += k.pathOf(points);
      }
      inner = k.lineSvg(d, { tone: 'lo' });
    }
    if (name === 'drive.face') {
      const point = G.pointOf(frame, b, r, (p.travel / 4.5) * Math.PI * 2),
        center = G.pointOf(frame, b, 0, 0);
      inner =
        k.lineSvg(k.segment(center, point, P), { tone: 'mid' }) +
        k.dotsSvg([k.iso(center, P)], { size: 0.5 });
    }
    add(
      name,
      frame.o.map((n, i) => n + (frame.a[i] * (a + b)) / 2),
      k.solidSvg(hole ? G.ringBand(a, b, hole, r, frame, P) : G.disc(a, b, r, frame, P), {
        inner,
        lit,
      }),
      {
        kind: 'body',
        F: frame,
        poly: hole
          ? [
              [a, hole],
              [a, r],
              [b, r],
              [b, hole],
            ]
          : [
              [a, 0],
              [a, r],
              [b, r],
              [b, 0],
            ],
      },
    );
  };
  const ring = (x: number, y: number, z: number) =>
    k.lineSvg(k.ring(x, y, 1.1, z, P, 24), { tone: 'lo' });
  const h = p.datum - 12;
  for (const [i, [x, y]] of [
    [-112, -30],
    [-112, 30],
    [112, -30],
    [112, 30],
  ].entries()) {
    const frame = { o: [x, y, 2], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
    screw(`datum.sleeve${i}`, frame, 0, h * 0.6, 6, 0, 18);
    screw(`datum.column${i}`, frame, h * 0.6, h, 4);
  }
  slab('datum.cap', -128, -40, 256, 80, 2 + h, 2);
  const top = (x: number) => p.datum + (x + 112) * p.slope;
  prism('ramp.wedge', -120, 120, -8, 28, 4 + h, 4 + h, top(-120), top(120));
  for (const [i, y] of [-8, 25].entries())
    prism(
      `ramp.wear${i}`,
      -120,
      120,
      y,
      y + 3,
      top(-120),
      top(120),
      top(-120) + 0.8,
      top(120) + 0.8,
    );
  // Front measuring edge and ticks are rooted to its outline.
  const ticks = Array.from({ length: 29 }, (_, i) => {
    const x = -112 + i * 8;
    return k.lineSvg(k.segment([x, 28, top(x)], [x, 28, top(x) - (i % 7 ? 1.6 : 3)], P), {
      tone: 'lo',
    });
  }).join('');
  prism(
    'ramp.scale',
    -120,
    120,
    28,
    28.5,
    top(-120) - 4,
    top(120) - 4,
    top(-120),
    top(120),
    false,
    ticks,
  );
  slab('datum.reference', -122, 31, 244, 1, 4 + h, 8);
  for (const [i, x] of [-124, 122].entries()) {
    slab(`datum.cheek${i}`, x, -38, 2, 76, 4 + h, 4);
    slab(`datum.fastener${i}`, x, -34, 2, 2, 8 + h, 0.6, ring(x + 1, -33, 8.6 + h));
  }
  const a = [1, 0, p.slope],
    len = Math.hypot(...a),
    axis = a.map((n) => n / len);
  const SF: Frame = {
    o: [-120, -25, top(-120) + 9],
    a: axis,
    u: [0, 1, 0],
    v: [-axis[2], 0, axis[0]],
  };
  for (const [i, x] of [-117, 117].entries()) {
    slab(`bearing.foot${i}`, x - 3, -34, 6, 26, 4 + h, 2);
    prism(
      `bearing.pad${i}`,
      x - 3,
      x + 3,
      -29,
      -21,
      6 + h,
      6 + h,
      top(x - 3) + 9 - 4 * len,
      top(x + 3) + 9 - 4 * len,
    );
    // Rings sit on pads; the shaft passes through their real central holes.
    const s = (x + 120) * len;
    halfBearing(`bearing.ring${i}`, SF, s - 2, s + 2, 1.5, 4);
  }
  // Split at the follower nut: genuine thread engagement, no overlapping stand-in solids.
  const mid = (p.x + 120) * len;
  screw('drive.shaftLeft', SF, 0, mid - 3, 1.5, 0, 2);
  screw('drive.shaftRight', SF, mid + 3, 247 * len, 1.5, 0, 2);
  screw('follower.nut', SF, mid - 3, mid + 3, 3.1, 1.5, 18);
  screw('drive.hub', SF, 247 * len, 250 * len, 3);
  screw('drive.wheel', SF, 250 * len, 255 * len, 10, 0, 48);
  screw('drive.face', SF, 255 * len, 255.6 * len, 7);
  const z = top(p.x);
  prism(
    'follower.shoe',
    p.x - 5,
    p.x + 5,
    -8,
    28,
    z - 5 * p.slope + 0.8,
    z + 5 * p.slope + 0.8,
    z + 4 + 5 * p.slope,
    z + 4 + 5 * p.slope,
  );
  slab('follower.saddle', p.x - 3, -22, 6, 14, z + 6, 2);
  slab('follower.link', p.x - 3, -8, 6, 3, z + 4 + 5 * p.slope, 4 - 5 * p.slope);
  slab('follower.witness', p.x - 2, 28, 4, 5, z, 5, '', true);
  slab('follower.bead', p.x - 3, 33, 6, 1.5, z, 1, '', true);
  for (const [i, y] of [1, 20].entries())
    slab(
      `follower.fastener${i}`,
      p.x - 1.5,
      y - 1.5,
      3,
      3,
      z + 4 + 5 * p.slope,
      0.5,
      ring(p.x, y, z + 4.5 + 5 * p.slope),
    );
  return parts;
}
