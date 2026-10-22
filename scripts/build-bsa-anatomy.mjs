import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { bsaPose, bsaExample } from '../src/anatomy/bsa-model.ts';

const base = { x: -143, y: -32, w: 286, d: 88, r: 7 };
const P = k.fitProjection(
  [...k.boxCorners(base, -18, 0), [-122, -12, 230], [115, 18, 230]],
  680,
  450,
  { pad: 40, azimuth: 69, elevation: 24 },
);
const at = (p) => k.iso(p, P),
  S = k.solidSvg,
  L = k.lineSvg;
function scene(values, form = 0) {
  const pose = bsaPose(values, form);
  if (!pose) throw Error('Invalid BSA scene');
  const R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static', kind = null) =>
    R.put({ name, at: point, svg, group, kind, piece: group, shapes: [R.solid(shape)] });
  function slab(
    name,
    plan,
    z,
    h,
    tone = 'mid',
    inner = '',
    group = 'static',
    lit = false,
    kind = null,
  ) {
    put(
      name,
      [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
      S(k.slabOf(plan, z, h, P, 8, kind ? 0 : Math.min(0.6, h / 3)), { tone, inner, lit }),
      A.slab(plan, z, h, { name, owner: name }),
      group,
      kind,
    );
  }
  function disc(name, x, y, z, r, h, group = 'static', knurled = false) {
    const F = G.frameAlong([x, y, z], [0, 0, 1]);
    put(
      name,
      [x, y, z + h / 2],
      S(G.disc(0, h, r, F, P), {
        tone: 'mid',
        inner: knurled
          ? k.fadedSvg(G.ribsOf(F, 0, h, r, 30, P, { seams: true, fade: [0.04, 0.4] }), {
              tone: 'lo',
            })
          : '',
      }),
      A.disc(F, 0, h, r, { name, owner: name }),
      group,
    );
  }
  const screw = (x, y, z) =>
    L(k.ring(x, y, 1.4, z, P, 24), { tone: 'lo' }) + k.dotsSvg([at([x, y, z])], { size: 0.45 });
  const screws = (plan, z, inset = 3) =>
    k
      .corners(plan, inset)
      .map(([x, y]) => screw(x, y, z))
      .join('');
  for (const [i, [x, y]] of k.corners(base, 20).entries()) {
    slab(`stand.pad${i}`, { x: x - 7, y: y - 7, w: 14, d: 14, r: 2 }, -18, 3, 'lo');
    slab(`stand.foot${i}`, { x: x - 5, y: y - 5, w: 10, d: 10, r: 1 }, -15, 5, 'lo');
  }
  slab('stand.sole', k.insetPlan(base, 2), -10, 3, 'lo');
  slab(
    'stand.plinth',
    base,
    -7,
    7,
    'lo',
    L(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 10),
  );
  for (const [i, x] of [-124, 94].entries()) {
    const foot = { x, y: -16, w: 28, d: 38, r: 2 };
    slab(`stand.footplate${i}`, foot, 0, 12, 'mid', screws(foot, 12, 5));
    for (const [j, dx] of [3, 21].entries())
      slab(
        `stand.boltpad${i}${j}`,
        { x: x + dx, y: 16, w: 4, d: 4, r: 0.5 },
        12,
        1,
        'mid',
        screw(x + dx + 2, 18, 13),
      );
  }
  slab('frame.left', { x: -118, y: -8, w: 12, d: 16, r: 0 }, 12, 212, 'mid');
  slab('frame.right', { x: 100, y: -8, w: 12, d: 16, r: 0 }, 12, 212, 'mid');
  slab('frame.lower', { x: -106, y: -8, w: 206, d: 16, r: 0 }, 12, 12, 'mid');
  slab('frame.upper', { x: -106, y: -8, w: 206, d: 6, r: 0 }, 218, 6, 'mid');
  for (const [i, x] of [-120, 98].entries())
    slab(
      `frame.cap${i}`,
      { x, y: -10, w: 16, d: 18, r: 1 },
      224,
      4,
      'mid',
      screws({ x, y: -10, w: 16, d: 18, r: 1 }, 228),
    );
  slab('frame.riser', { x: -100, y: 0, w: 194, d: 8, r: 0 }, 24, 10, 'lo');
  slab('jaw.bottom', { x: -100, y: 0, w: 194, d: 8, r: 0 }, 34, 6, 'hi');
  slab('jaw.left', { x: -106, y: 0, w: 6, d: 8, r: 0 }, 40, 184, 'hi');
  slab('guide.rear', { x: -100, y: -10, w: 194, d: 8, r: 0 }, 24, 10, 'mid');
  const upright = { x: -115, y: 8, w: 12, d: 1, r: 0 };
  let ticks = '';
  for (let z = 44; z < 220; z += 4)
    ticks += L(k.segment([-115, 9, z], [-115 + (z % 20 === 4 ? 4 : 2.5), 9, z], P), {
      tone: z % 20 === 4 ? 'mid' : 'lo',
    });
  slab('guide.vertical', upright, 40, 184, 'lo', ticks);
  const bottomStrip = { x: -100, y: 8, w: 194, d: 5, r: 0 };
  const scale = k.topTicks(-96, 90, 4, 5, 8, 24.6, [2, 3.5], P);
  slab(
    'guide.horizontal',
    bottomStrip,
    24,
    0.6,
    'lo',
    L(scale.minor, { tone: 'lo' }) + L(scale.major, { tone: 'mid' }),
  );
  // Variable jaws and the luminous numerical aperture are real prisms.
  const x = -100 + pose.w,
    z = 40 + pose.h;
  slab(
    'opening',
    { x: -100, y: -1, w: pose.w, d: 1, r: 0 },
    40,
    pose.h,
    'hi',
    '',
    'variable',
    true,
    'opening',
  );
  slab(
    'jaw.right',
    { x, y: 0, w: 5, d: 8, r: 0 },
    40,
    pose.h,
    'hi',
    '',
    'variable',
    false,
    'rightJaw',
  );
  slab(
    'jaw.top',
    { x: -100, y: 0, w: pose.w + 5, d: 8, r: 0 },
    z,
    6,
    'hi',
    '',
    'variable',
    false,
    'topJaw',
  );
  slab(
    'drive.tongue',
    { x, y: -2, w: 5, d: 2, r: 0 },
    40,
    Math.min(4, pose.h),
    'mid',
    '',
    'variable',
    false,
    'tongue',
  );
  const lift = { x: -117, y: 9, w: 19, d: 6, r: 0 };
  slab('top.carriage', lift, z - 6, 16, 'mid', '', 'top');
  slab('top.cap', lift, z + 10, 2, 'mid', screws(lift, z + 12), 'top');
  // Horizontal-axis knob on the front of the lift carriage.
  const F = G.frameAlong([-109, 15, z + 2], [0, 1, 0]);
  put(
    'top.boss',
    [-109, 16, z + 2],
    S(G.disc(0, 2, 2.5, F, P), { tone: 'mid' }),
    A.disc(F, 0, 2, 2.5, { name: 'top.boss' }),
    'top',
  );
  put(
    'top.wheel',
    [-109, 19, z + 2],
    S(G.disc(2, 6, 4.5, F, P), {
      tone: 'mid',
      inner: k.fadedSvg(G.ribsOf(F, 2, 6, 4.5, 32, P, { seams: true, fade: [0.04, 0.4] }), {
        tone: 'lo',
      }),
    }),
    A.disc(F, 2, 6, 4.5, { name: 'top.wheel' }),
    'top',
  );
  const carriage = { x: x - 5, y: -10, w: 14, d: 8, r: 0 };
  slab('right.carriage', carriage, 34, 12, 'mid', '', 'right');
  slab('right.cap', carriage, 46, 2, 'mid', screws(carriage, 48), 'right');
  disc('right.spindle', x + 2, -6, 48, 2, 2, 'right');
  disc('right.wheel', x + 2, -6, 50, 3.5, 4, 'right', true);
  const controller = { x: 48, y: 28, w: 60, d: 19, r: 2 };
  slab('control.body', controller, 0, 8, 'mid');
  slab('control.lid', controller, 8, 2, 'mid', screws(controller, 10));
  disc('control.pedestal', 91, 37, 10, 4, 2);
  disc('control.form-wheel', 91, 37, 12, 3.5, 3, 'static', true);
  const label = { x: -94, y: 32, w: 56, d: 12, r: 1 };
  slab(
    'stand.label',
    label,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-66, 40], 0.5, P), 'A = s²', {
      size: 3.1,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(label, 0.5),
  );
  for (const [i, plan] of [
    { x: -96, y: -27, w: 48, d: 3, r: 1 },
    { x: -96, y: -21, w: 32, d: 3, r: 1 },
  ].entries())
    slab(`stand.calibration${i}`, plan, 0, 0.5, 'lo');
  return R;
}
// Solve one painter order from the union of real overlaps across the travel.
// The runtime can then translate and resize parts without depth-order pops.
const samples = [];
for (const values of [
  bsaExample,
  { height: 200, weight: 75 },
  { height: 175, weight: 100 },
  { height: 100, weight: 0.000001 },
  { height: 250, weight: 0.000001 },
  { height: 100, weight: 500 },
  { height: 250, weight: 500 },
]) {
  for (const form of [0, 0.25, 0.5, 0.75, 1]) {
    const R = scene(values, form);
    const overlaps = A.overlapsOf(R.items, P);
    samples.push({ R, overlaps, values, form });
  }
}
const R = samples[0].R;
const combined = { ...samples[0].overlaps, pairs: samples.flatMap((s) => s.overlaps.pairs) };
const solved = A.orderKeys(R.items, combined);
if (solved.cycles.length || solved.dropped.length)
  throw Error('Aperture travel needs split geometry to admit one painter order');
for (const sample of samples) {
  sample.R.items.forEach((item, index) => {
    item.key = solved.keys[index];
  });
  sample.R.settled = {
    items: sample.R.items.slice(),
    overlaps: sample.overlaps,
    solved,
    states: [0],
  };
  if (process.argv.includes('--audit')) {
    console.log('Aperture pose', sample.values, sample.form);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Aperture audit failed; refusing to replace generated art');
R.items.sort((a, b) => a.key - b.key);
const origin = at([0, 0, 0]),
  vector = (v) => at(v).map((n, i) => n - origin[i]);
const pose = bsaPose(bsaExample);
writeFileSync(
  new URL('../src/anatomy/bsa-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 460,
    origin,
    xVector: vector([1, 0, 0]),
    yVector: vector([0, 1, 0]),
    zVector: vector([0, 0, 1]),
    initialW: pose.w,
    initialH: pose.h,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -18, 12, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, kind: i.kind, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} aperture parts`);
