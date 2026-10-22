import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { shockPose, shockExample } from '../src/anatomy/shock-model.ts';
import { shockWeight } from '../src/anatomy/shock-weight.ts';
const base = { x: -146, y: -36, w: 292, d: 96, r: 8 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-124, -24, 156], [124, 24, 156]],
  680,
  420,
  { pad: 35, azimuth: 60, elevation: 29 },
);
const at = (p) => k.iso(p, P),
  origin = at([0, 0, 0]);
const vector = (v) => at(v).map((n, i) => n - origin[i]);
const projection = {
  origin,
  xVector: vector([1, 0, 0]),
  yVector: vector([0, 1, 0]),
  zVector: vector([0, 0, 1]),
};
const S = k.solidSvg,
  L = k.lineSvg;
function scene(values) {
  const pose = shockPose(values);
  if (!pose) throw Error('Invalid shock balance pose');
  const R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static') =>
    R.put({ name, at: point, svg, group, piece: group, shapes: [R.solid(shape)] });
  const screw = (x, y, z) =>
    L(k.ring(x, y, 1.4, z, P, 24), { tone: 'lo' }) + k.dotsSvg([at([x, y, z])], { size: 0.45 });
  const screws = (plan, z, inset = 3) =>
    k
      .corners(plan, inset)
      .map(([x, y]) => screw(x, y, z))
      .join('');
  function slab(name, plan, z, h, tone = 'mid', inner = '', group = 'static', lit = false) {
    put(
      name,
      [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
      S(k.slabOf(plan, z, h, P, 8, Math.min(0.5, h / 3)), { tone, inner, lit }),
      A.slab(plan, z, h, { name, owner: name }),
      group,
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
          ? k.fadedSvg(G.ribsOf(F, 0, h, r, 32, P, { seams: true, fade: [0.04, 0.4] }), {
              tone: 'lo',
            })
          : '',
      }),
      A.disc(F, 0, h, r, { name, owner: name }),
      group,
    );
  }
  for (const [i, [x, y]] of k.corners(base, 20).entries()) {
    slab(`stand.pad${i}`, { x: x - 7, y: y - 7, w: 14, d: 14, r: 2 }, -16, 3, 'lo');
    slab(`stand.foot${i}`, { x: x - 5, y: y - 5, w: 10, d: 10, r: 1 }, -13, 5, 'lo');
  }
  slab('stand.sole', k.insetPlan(base, 2), -8, 2, 'lo');
  slab(
    'stand.plinth',
    base,
    -6,
    6,
    'lo',
    L(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 10),
  );
  for (const [i, y] of [-12, 8].entries())
    slab(`track.rail${i}`, { x: -125, y, w: 250, d: 4, r: 0.5 }, 0, 4, 'mid');
  for (const [i, x] of [-131, 125].entries()) {
    slab(`track.stop${i}`, { x, y: -15, w: 6, d: 30, r: 1 }, 0, 7, 'mid');
    for (const [j, y] of [-13, 9].entries())
      slab(
        `track.bolt${i}${j}`,
        { x: x + 1, y, w: 4, d: 4, r: 0.4 },
        7,
        1,
        'mid',
        screw(x + 3, y + 2, 8),
      );
  }
  const rule = { x: -120, y: 12, w: 240, d: 5, r: 0 };
  const ticks = k.topTicks(-116, 116, 4, 5, 12, 0.6, [2, 3.5], P);
  slab(
    'track.ruler',
    rule,
    0,
    0.6,
    'lo',
    L(ticks.minor, { tone: 'lo' }) + L(ticks.major, { tone: 'mid' }),
  );
  const x = pose.pivot,
    slide = { x: x - 14, y: -10, w: 28, d: 20, r: 1 };
  slab('pivot.slide', slide, 4, 6, 'mid', '', 'pivot');
  slab('pivot.lid', slide, 10, 2, 'mid', screws(slide, 12, 4), 'pivot');
  slab('pivot.column', { x: x - 5, y: -6, w: 10, d: 12, r: 0 }, 12, 72, 'hi', '', 'pivot', true);
  slab('pivot.head', { x: x - 9, y: -8, w: 18, d: 16, r: 1 }, 84, 2, 'hi', '', 'pivot');
  const F = G.frameAlong([x, -5, 88], [0, 1, 0]);
  put(
    'pivot.bearing',
    [x, 0, 88],
    S(G.disc(0, 10, 2, F, P), { tone: 'hi' }),
    A.disc(F, 0, 10, 2, { name: 'pivot.bearing' }),
    'pivot',
  );
  put(
    'pivot.cap',
    [x, 5.5, 88],
    S(G.disc(10, 11, 2, F, P), { tone: 'hi' }),
    A.disc(F, 10, 11, 2, { name: 'pivot.cap' }),
    'pivot',
  );
  slab('pivot.pointer', { x: x - 1, y: 10, w: 2, d: 8, r: 0 }, 10, 1, 'hi', '', 'pivot');
  slab(
    'balance.beam',
    { x: -126, y: -4, w: 252, d: 8, r: 0 },
    90,
    6,
    'hi',
    L(k.sideSeam({ x: -126, y: -4, w: 252, d: 8, r: 0 }, 93, P), { tone: 'faint' }),
  );
  for (const [i, cx] of [-100, 100].entries()) {
    disc(`pan${i}.floor`, cx, 0, 96, 21, 2);
    // Split each real annular rim into four quadrants so its front and back can
    // occupy their correct painter slots around an almost empty weight.
    for (let q = 0; q < 4; q++) {
      const points = [];
      for (let n = 0; n <= 16; n++) {
        const t = ((q + n / 16) * Math.PI) / 2;
        points.push([cx + 21 * Math.cos(t), 21 * Math.sin(t)]);
      }
      for (let n = 16; n >= 0; n--) {
        const t = ((q + n / 16) * Math.PI) / 2;
        points.push([cx + 18 * Math.cos(t), 18 * Math.sin(t)]);
      }
      put(
        `pan${i}.rim${q}`,
        [cx, 0, 98.5],
        S(k.extrude(points, 98, 1, P), { tone: 'mid' }),
        A.prism({ o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] }, points, 98, 99, {
          name: `pan${i}.rim${q}`,
        }),
      );
    }
    const h = pose.heights[i];
    put(
      `weight${i}.body`,
      [cx, 0, 98 + h / 2],
      shockWeight(projection, i, h),
      A.cylinder(cx, 0, 11, 98, h, { name: `weight${i}.body` }),
      `weight${i}`,
    );
    const group = `cap${i}`,
      z = 98 + h;
    disc(`weight${i}.cap`, cx, 0, z, 11, 1.5, group);
    disc(`weight${i}.spindle`, cx, 0, z + 1.5, 2.5, 2, group);
    disc(`weight${i}.crown`, cx, 0, z + 3.5, 4.5, 4, group, true);
  }
  const plaque = { x: -118, y: 34, w: 60, d: 14, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-88, 43], 0.5, P), 'H · a = P · b', {
      size: 3,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5),
  );
  for (const [i, plan] of [
    { x: -46, y: 36, w: 32, d: 2, r: 0.5 },
    { x: -46, y: 42, w: 24, d: 2, r: 0.5 },
    { x: -46, y: 48, w: 28, d: 2, r: 0.5 },
  ].entries())
    slab(`stand.rule${i}`, plan, 0, 0.5, 'lo');
  for (const [i, cx] of [42, 92].entries()) {
    const plan = { x: cx - 16, y: 30, w: 32, d: 20, r: 2 };
    slab(`control${i}.body`, plan, 0, 6, 'mid');
    slab(`control${i}.lid`, plan, 6, 1.5, 'mid');
    for (const [j, dx] of [-11, 11].entries())
      slab(
        `control${i}.screw${j}`,
        { x: cx + dx - 2, y: 36, w: 4, d: 8, r: 0.5 },
        7.5,
        0.5,
        'mid',
        screw(cx + dx, 40, 8),
      );
  }
  return R;
}
const samples = [];
for (const values of [
  shockExample,
  { heartRate: 120, systolic: 120 },
  { heartRate: 90, systolic: 90 },
  { heartRate: 180, systolic: 240 },
  { heartRate: 120, systolic: 80 },
  { heartRate: 0.000001, systolic: 300 },
  { heartRate: 300, systolic: 0.000001 },
  { heartRate: 0.000001, systolic: 0.000001 },
  { heartRate: 1e6, systolic: 2e6 },
]) {
  const R = scene(values),
    overlaps = A.overlapsOf(R.items, P);
  samples.push({ R, overlaps, values });
}
const R = samples[0].R,
  solved = A.orderKeys(R.items, {
    ...samples[0].overlaps,
    pairs: samples.flatMap((s) => s.overlaps.pairs),
  });
if (solved.cycles.length || solved.dropped.length)
  throw Error(
    `Balance needs split geometry: ${solved.cycles.length} cycles, ${solved.dropped.length} dropped rules`,
  );
for (const sample of samples) {
  sample.R.items.forEach((item, i) => (item.key = solved.keys[i]));
  sample.R.settled = {
    items: sample.R.items.slice(),
    overlaps: sample.overlaps,
    solved,
    states: [0],
  };
  if (process.argv.includes('--audit')) {
    console.log('Balance pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Balance audit failed; refusing to replace generated art');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/shock-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 420,
    ...projection,
    initialPivot: shockPose(shockExample).pivot,
    initialHeights: shockPose(shockExample).heights,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} balance parts`);
