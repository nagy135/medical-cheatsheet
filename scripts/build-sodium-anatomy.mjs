import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { sodiumExample, sodiumPose } from '../src/anatomy/sodium-model.ts';
import { sodiumMechanism } from '../src/anatomy/sodium-solid.ts';
const base = { x: -155, y: -50, w: 310, d: 125, r: 8 };
const P = k.fitProjection(
  [...k.boxCorners(base, -15, 0), [-145, -45, 138], [145, 42, 138]],
  680,
  420,
  { pad: 32, azimuth: 57, elevation: 28 },
);
const at = (v) => k.iso(v, P),
  origin = at([0, 0, 0]),
  vector = (v) => at(v).map((n, i) => n - origin[i]);
const staticParts = [];
const put = (name, at, svg, shape) =>
  staticParts.push({ name, at, svg, shape: { ...shape, name } });
const screws = (plan, z) =>
  k
    .corners(plan, 3)
    .map(
      ([x, y]) =>
        k.lineSvg(k.ring(x, y, 1, z, P, 24), { tone: 'lo' }) +
        k.dotsSvg([at([x, y, z])], { size: 0.4 }),
    )
    .join('');
function slab(name, plan, z, h, inner = '') {
  put(
    name,
    [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
    k.solidSvg(k.slabOf(plan, z, h, P, 8, 0.3), { inner }),
    A.slab(plan, z, h),
  );
}
for (const [i, [x, y]] of k.corners(base, 18).entries()) {
  slab(`stand.pad${i}`, { x: x - 7, y: y - 7, w: 14, d: 14, r: 2 }, -15, 3);
  slab(`stand.foot${i}`, { x: x - 5, y: y - 5, w: 10, d: 10, r: 1 }, -12, 4);
}
slab('stand.sole', k.insetPlan(base, 2), -8, 2);
slab(
  'stand.bed',
  base,
  -6,
  6,
  k.lineSvg(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }),
);
for (const [i, [x, y]] of k.corners(base, 10).entries()) {
  const F = G.frameAlong([x, y, 0], [0, 0, 1]);
  put(
    `bed.bolt${i}`,
    [x, y, 0.3],
    k.solidSvg(G.disc(0, 0.6, 1.8, F, P), {
      inner: k.lineSvg(k.segment([x - 1.8, y, 0.6], [x + 1.8, y, 0.6], P), { tone: 'lo' }),
    }),
    A.disc(F, 0, 0.6, 1.8),
  );
}
slab('datum.mount', { x: -128, y: -40, w: 256, d: 80, r: 2 }, 0, 2);
const knob = { x: -125, y: 47, w: 34, d: 20, r: 2 };
slab('control.body', knob, 0, 5);
slab('control.cover', knob, 5, 1, screws(knob, 6));
const F = G.frameAlong([-108, 57, 6], [0, 0, 1]);
for (const [name, z, h, r, ribs] of [
  ['collar', 0, 2, 3, 0],
  ['wheel', 2, 5, 8, 42],
  ['dial', 7, 0.5, 5, 0],
])
  put(
    `control.${name}`,
    [-108, 57, 6 + z + h / 2],
    k.solidSvg(G.disc(z, z + h, r, F, P), {
      inner: ribs
        ? k.fadedSvg(G.ribsOf(F, z, z + h, r, ribs, P, { seams: true, fade: [0.04, 0.4] }), {
            tone: 'lo',
          })
        : '',
    }),
    A.disc(F, z, z + h, r),
  );
const label = { x: -67, y: 49, w: 82, d: 15, r: 1 };
slab(
  'bed.label',
  label,
  0,
  0.6,
  k.faceTextSvg(k.topMatrix([-26, 58], 0.6, P), 'KATZ · 1,6 / 100', {
    size: 3,
    anchor: 'middle',
    tone: 'lo',
  }) + screws(label, 0.6),
);
for (const [i, x] of [34, 80].entries()) {
  const plan = { x, y: 48, w: 30, d: 17, r: 2 };
  slab(`bench.stop${i}`, plan, 0, 3, screws(plan, 3));
  slab(`bench.stopCap${i}`, { x: x + 5, y: 51, w: 20, d: 11, r: 1 }, 3, 2);
}
function scene(values) {
  const R = A.recorder(P);
  for (const part of [...staticParts, ...sodiumMechanism(P, sodiumPose(values))])
    R.put({ ...part, shapes: [R.solid(part.shape)] });
  return R;
}
const values = [
  sodiumExample,
  { sodium: 140, glucose: 100 },
  { sodium: 130, glucose: 100.001 },
  { sodium: 140, glucose: 1000 },
  { sodium: 100, glucose: 2000 },
  { sodium: 0.000001, glucose: 100 },
  { sodium: 1e6, glucose: 1e6 },
  ...Array.from({ length: 11 }, (_, i) => ({ sodium: 100 + i * 7, glucose: 100 + i * 80 })),
];
const samples = values.map((v) => {
  const R = scene(v);
  return { R, v, overlaps: A.overlapsOf(R.items, P) };
});
const solved = A.orderKeys(samples[0].R.items, {
  ...samples[0].overlaps,
  pairs: samples.flatMap((s) => s.overlaps.pairs),
});
if (solved.cycles.length || solved.dropped.length) {
  console.log(
    solved.cycles.map((c) => ({
      ...c,
      a: samples[0].R.items[c.a].name,
      b: samples[0].R.items[c.b].name,
    })),
    solved.dropped,
  );
  throw Error('Split geometry needed');
}
for (const s of samples) {
  s.R.items.forEach((p, i) => (p.key = solved.keys[i]));
  s.R.settled = { items: s.R.items.slice(), overlaps: s.overlaps, solved, states: [0] };
  if (process.argv.includes('--audit')) {
    console.log('Katz ramp', s.v);
    A.auditOrExit(s.R, P);
  }
}
if (process.exitCode) throw Error('Audit failed; refusing art');
const initial = samples[0].R;
initial.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/sodium-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 420,
    projection: P,
    origin,
    xVector: vector([1, 0, 0]),
    yVector: vector([0, 1, 0]),
    zVector: vector([0, 0, 1]),
    halo: `<path class="iso-halo" d="${k.haloOf(base, -15, 8, P)}"/>`,
    order: initial.items.map((p) => p.name),
    parts: initial.items.map((p) => ({
      name: p.name,
      variable: !staticParts.some((s) => s.name === p.name),
      svg: p.svg,
    })),
  }),
);
console.log(
  `Generated ${initial.items.length} Katz ramp solids; ${samples.length} parameter poses`,
);
