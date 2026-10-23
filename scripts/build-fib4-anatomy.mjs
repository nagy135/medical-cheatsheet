import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { fib4Pose, fib4Example } from '../src/anatomy/fib4-model.ts';
import { fib4Bounds, fib4Solid, fib4Controls } from '../src/anatomy/fib4-solid.ts';
const base = { x: -170, y: -90, w: 340, d: 185, r: 12 };
const P = k.fitProjection(
  [...k.boxCorners(base, -14, 0), [-120, 30, 68], [140, -55, 68]],
  680,
  430,
  { pad: 35, azimuth: 36, elevation: 39 },
);
const at = (p) => k.iso(p, P),
  origin = at([0, 0, 0]),
  vector = (v) => at(v).map((n, i) => n - origin[i]);
const projection = {
  origin,
  xVector: vector([1, 0, 0]),
  yVector: vector([0, 1, 0]),
  zVector: vector([0, 0, 1]),
};
const S = k.solidSvg,
  L = k.lineSvg;
function scene(values) {
  const pose = fib4Pose(values),
    R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static') =>
    R.put({ name, at: point, svg, group, piece: group, shapes: [R.solid(shape)] });
  const screws = (p, z) =>
    k
      .corners(p, 3)
      .map(
        ([x, y]) =>
          L(k.ring(x, y, 1, z, P, 24), { tone: 'lo' }) + k.dotsSvg([at([x, y, z])], { size: 0.35 }),
      )
      .join('');
  function slab(name, p, z, h, tone = 'mid', inner = '', group = 'static') {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      S(k.slabOf(p, z, h, P, 8, Math.min(0.5, h / 3)), { tone, inner }),
      A.slab(p, z, h, { name }),
      group,
    );
  }
  const box = (name, x, y, w, d, z, h, tone = 'mid', inner = '', group = 'static') =>
    slab(name, { x, y, w, d, r: 0 }, z, h, tone, inner, group);
  for (const [i, [x, y]] of k.corners(base, 22).entries()) {
    slab(`stand.pad${i}`, { x: x - 8, y: y - 8, w: 16, d: 16, r: 3 }, -14, 3, 'lo');
    slab(`stand.foot${i}`, { x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, -11, 5, 'lo');
  }
  slab('stand.sole', k.insetPlan(base, 2), -6, 2, 'lo');
  slab(
    'stand.deck',
    base,
    -4,
    4,
    'lo',
    L(k.planOutline(k.insetPlan(base, 6), 0, P), { tone: 'faint' }) +
      screws(k.insetPlan(base, 7), 0),
  );
  const plaque = { x: -80, y: 57, w: 140, d: 19, r: 2 };
  slab(
    'stand.label',
    plaque,
    0,
    0.6,
    'lo',
    screws(plaque, 0.6) +
      k.faceTextSvg(k.topMatrix([-10, 69], 0.6, P), 'FIB–4 · CAM COMPARATOR', {
        size: 3,
        anchor: 'middle',
        tone: 'lo',
      }),
  );
  pose.positions.forEach(({ x }, i) => {
    const { x: cx, y, z } = pose.contacts[i];
    const cassette = { x: x - 15, y: -62, w: 30, d: 104, r: 3 };
    slab(`cam${i}.plinth`, cassette, 0, 6, 'mid', screws(cassette, 6));
    box(`cam${i}.heel`, x - 11, -62, 22, 3, 6, 6);
    box(`cam${i}.stop`, x - 11, 34, 22, 5, 6, 6);
    // u follows world y, v world z. This exact prism is also recorded by the audit.
    const F = G.frameAlong([x - 9, 0, 0], [1, 0, 0]);
    const curve = Array.from({ length: 129 }, (_, j) => {
      const t = (j / 128) ** 2;
      return [-54 + 88 * t, 11 + 32 * (i === 3 ? Math.sqrt(t) : t)];
    });
    const polygon = [[-54, 6], [34, 6], ...curve.slice().reverse()];
    put(
      `cam${i}.profile`,
      [x, -10, 22],
      S(G.prismOf(F, polygon, 0, 18, P), { tone: i === 3 ? 'hi' : 'mid', lit: i === 3 }),
      A.prism(F, polygon, 0, 18, { name: `cam${i}.profile` }),
    );
    const rule = { x: x + 10, y: -54, w: 2, d: 88, r: 0 };
    let ticks = '';
    for (let j = 0; j <= 20; j++)
      ticks += L(
        k.segment(
          [x + 12, -54 + (88 * j) / 20, 6.5],
          [x + 12 - (j % 5 ? 1 : 2), -54 + (88 * j) / 20, 6.5],
          P,
        ),
        { tone: 'lo' },
      );
    slab(`cam${i}.rule`, rule, 6, 0.5, 'lo', ticks);
    const group = `feeler${i}`,
      Fv = G.frameAlong([cx, y, z + 2], [0, 0, 1]);
    put(
      `${group}.contact`,
      [cx, y, z],
      S(G.sphereOf([cx, y, z], 2, P), { tone: 'hi' }),
      A.ball([cx, y, z], 2, { name: `${group}.contact` }),
      group,
    );
    for (const [name, s0, s1, r] of [
      ['spindle', 0, 9, 0.9],
      ['sleeve', 9, 11, 3],
      ['crown', 11, 15, 5],
    ]) {
      put(
        `${group}.${name}`,
        [cx, y, z + 2 + (s0 + s1) / 2],
        S(G.disc(s0, s1, r, Fv, P), {
          tone: 'mid',
          inner:
            name === 'crown'
              ? k.fadedSvg(G.ribsOf(Fv, s0, s1, r, 28, P, { seams: true, fade: [0.04, 0.4] }), {
                  tone: 'lo',
                })
              : '',
        }),
        A.disc(Fv, s0, s1, r, { name: `${group}.${name}` }),
        group,
      );
    }
  });
  fib4Controls.forEach(([x, y], i) => {
    const F = G.frameAlong([x, y, 0], [0, 0, 1]);
    for (const [name, s0, s1, r] of [
      ['bearing', 0, 2, 5],
      ['wheel', 2, 7, 8],
      ['dial', 7, 7.6, 6],
    ]) {
      put(
        `control${i}.${name}`,
        [x, y, (s0 + s1) / 2],
        S(G.disc(s0, s1, r, F, P), {
          tone: 'mid',
          inner:
            name === 'wheel'
              ? k.fadedSvg(G.ribsOf(F, s0, s1, r, 40, P, { seams: true, fade: [0.04, 0.4] }), {
                  tone: 'lo',
                })
              : name === 'dial'
                ? L(k.ring(x, y, 4, 7.6, P, 40), { tone: 'lo' }) +
                  k.dotsSvg([at([x, y, 7.6])], { size: 0.5 })
                : '',
        }),
        A.disc(F, s0, s1, r, { name: `control${i}.${name}` }),
      );
    }
  });
  for (const [i, x] of [78, 98, 127].entries()) {
    box(`register${i}.rail`, x - 2, -56, i === 2 ? 10 : 14, 88, 0, 6, 'lo');
    box(`register${i}.stop`, x - 2, -59, i === 2 ? 10 : 14, 3, 0, 8);
  }
  const strip = { x: 112, y: -50, w: 3, d: 76, r: 0 };
  let ticks = '';
  for (let j = 0; j <= 20; j++)
    ticks += L(k.segment([115, -50 + j * 3.8, 1], [115 - (j % 5 ? 1.5 : 3), -50 + j * 3.8, 1], P), {
      tone: 'lo',
    });
  slab('register.commonRule', strip, 0, 1, 'lo', ticks);
  const qrule = { x: 139, y: -50, w: 3, d: 76, r: 0 };
  slab(
    'quotient.rule',
    qrule,
    0,
    1,
    'lo',
    L(k.segment([142, -50, 1], [142, 26, 1], P), { tone: 'lo' }),
  );
  for (const [group, b] of Object.entries(fib4Bounds(pose))) {
    const [x, y, z, w, d, h] = b;
    put(
      `register.${group}`,
      [x + w / 2, y + d / 2, z + h / 2],
      fib4Solid(projection, b, group === 'quotient'),
      A.slab({ x, y, w, d, r: 0 }, z, h, { name: `register.${group}` }),
      group,
    );
  }
  return R;
}
const values = [
  fib4Example,
  { ...fib4Example, age: 120 },
  { ...fib4Example, ast: 80 },
  { ...fib4Example, platelets: 400 },
  { ...fib4Example, alt: 140 },
  { age: 18, ast: 0.000001, platelets: 0.000001, alt: 0.000001 },
  { age: 120, ast: 1e6, platelets: 0.000001, alt: 1e6 },
  { age: 60, ast: 0.000001, platelets: 1e6, alt: 140 },
  ...Array.from({ length: 6 }, (_, i) => ({ ...fib4Example, ast: 40 + 10 * i, alt: 35 + 10 * i })),
];
const samples = values.map((values) => {
  const R = scene(values);
  return { R, values, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R,
  solved = A.orderKeys(R.items, {
    ...samples[0].overlaps,
    pairs: samples.flatMap((s) => s.overlaps.pairs),
  });
if (solved.cycles.length || solved.dropped.length) {
  console.log(
    solved.cycles,
    solved.dropped.map((d) => ({
      ...d,
      frontName: R.items[d.front].name,
      backName: R.items[d.back].name,
    })),
  );
  throw Error('Split interlocked geometry');
}
for (const sample of samples) {
  sample.R.items.forEach((item, i) => (item.key = solved.keys[i]));
  sample.R.settled = {
    items: sample.R.items.slice(),
    overlaps: sample.overlaps,
    solved,
    states: [0],
  };
  if (process.argv.includes('--audit')) {
    console.log('FIB-4 pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Audit failed; no art emitted');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/fib4-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 430,
    ...projection,
    initialPositions: fib4Pose(fib4Example).contacts,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -14, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} FIB-4 comparator solids`);
