import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { bmiPose, bmiExample } from '../src/anatomy/bmi-model.ts';
import { bmiBounds, bmiSolid } from '../src/anatomy/bmi-solid.ts';
const base = { x: -110, y: -110, w: 220, d: 270, r: 8 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-90, -90, 114], [90, 90, 114]],
  680,
  480,
  { pad: 38, azimuth: 45, elevation: 31 },
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
  const pose = bmiPose(values),
    R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static') =>
    R.put({ name, at: point, svg, group, piece: group, shapes: [R.solid(shape)] });
  const screws = (p, z, inset = 3) =>
    k
      .corners(p, inset)
      .map(
        ([x, y]) =>
          L(k.ring(x, y, 1.15, z, P, 24), { tone: 'lo' }) +
          k.dotsSvg([at([x, y, z])], { size: 0.35 }),
      )
      .join('');
  function slab(name, p, z, h, tone = 'mid', inner = '') {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      S(k.slabOf(p, z, h, P, 8, Math.min(0.45, h / 3)), { tone, inner }),
      A.slab(p, z, h, { name }),
    );
  }
  const box = (name, x, y, w, d, z, h, tone = 'mid', inner = '') =>
    slab(name, { x, y, w, d, r: 0 }, z, h, tone, inner);
  function disc(name, x, y, z, h, r, knurl = false) {
    const F = G.frameAlong([x, y, z], [0, 0, 1]);
    put(
      name,
      [x, y, z + h / 2],
      S(G.disc(0, h, r, F, P), {
        tone: 'mid',
        inner: knurl
          ? k.fadedSvg(G.ribsOf(F, 0, h, r, 40, P, { seams: true, fade: [0.04, 0.4] }), {
              tone: 'lo',
            })
          : '',
      }),
      A.disc(F, 0, h, r, { name }),
    );
  }
  for (const [i, [x, y]] of k.corners(base, 18).entries()) {
    slab(`stand.pad${i}`, { x: x - 8, y: y - 8, w: 16, d: 16, r: 2 }, -16, 3, 'lo');
    slab(`stand.foot${i}`, { x: x - 6, y: y - 6, w: 12, d: 12, r: 2 }, -13, 5, 'lo');
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
  for (const [i, [x, y]] of [
    [-82, -82],
    [82, -82],
    [-82, 82],
    [82, 82],
  ].entries()) {
    const p = { x: x - 10, y: y - 10, w: 20, d: 20, r: 2 };
    slab(`column${i}.pedestal`, p, 0, 5, 'mid', screws(p, 5, 3));
    disc(`column${i}.flange`, x, y, 5, 3, 8);
    disc(`column${i}.bearingLower`, x, y, 8, 12, 6);
    disc(`column${i}.shaft`, x, y, 20, 80, 4);
    disc(`column${i}.bearingUpper`, x, y, 100, 6, 6);
  }
  for (const [i, y] of [-88, 76].entries()) {
    const p = { x: -88, y, w: 176, d: 12, r: 0 };
    slab(
      `header.cross${i}`,
      p,
      106,
      6,
      'mid',
      screws(p, 112, 4) + L(k.sideSeam(p, 109, P), { tone: 'faint' }),
    );
  }
  for (const [i, x] of [-88, 76].entries()) box(`header.tie${i}`, x, -76, 12, 152, 106, 6, 'mid');
  slab('bed.seat', { x: -73, y: -73, w: 146, d: 146, r: 3 }, 0, 6, 'lo');
  slab(
    'bed.bolster',
    { x: -72, y: -72, w: 144, d: 144, r: 2 },
    6,
    6,
    'mid',
    screws({ x: -72, y: -72, w: 144, d: 144 }, 12, 5),
  );
  const bed = { x: -66, y: -66, w: 132, d: 132, r: 0 };
  let ticks = '';
  for (let n = -60; n <= 60; n += 5) {
    ticks += L(k.segment([n, 66, 14], [n, 66 - (n % 25 === 0 ? 4 : 2), 14], P), { tone: 'lo' });
    ticks += L(k.segment([66, n, 14], [66 - (n % 25 === 0 ? 4 : 2), n, 14], P), { tone: 'lo' });
  }
  slab('bed.ruleFace', bed, 12, 2, 'mid', ticks);
  for (const [kind, b] of Object.entries(bmiBounds(pose))) {
    const [x, y, z, w, d, h] = b;
    put(
      `subject.${kind}`,
      [x + w / 2, y + d / 2, z + h / 2],
      bmiSolid(projection, b, kind),
      A.slab({ x, y, w, d, r: 0 }, z, h, { name: `subject.${kind}` }),
      kind,
    );
  }
  for (const [i, x] of [-65, 65].entries()) {
    const p = { x: x - 17, y: 116, w: 34, d: 30, r: 3 };
    slab(`control${i}.body`, p, 0, 8, 'mid', L(k.sideSeam(p, 4, P), { tone: 'faint' }));
    slab(`control${i}.lid`, p, 8, 1, 'mid', screws(p, 9, 4));
    disc(`control${i}.spindle`, x, 132, 9, 3, 4);
    disc(`control${i}.wheel`, x, 132, 12, 7, 10, true);
    disc(`control${i}.face`, x, 132, 19, 0.5, 7);
  }
  const service = { x: -19, y: 119, w: 38, d: 24, r: 2 };
  slab('service.hatch', service, 0, 2, 'lo', screws(service, 2, 3));
  for (let i = 0; i < 3; i++)
    slab(`service.vent${i}`, { x: -10 + i * 8, y: 125, w: 3, d: 12, r: 1 }, 2, 0.4, 'lo');
  return R;
}
const values = [
  bmiExample,
  { weight: 100, height: 175 },
  { weight: 75, height: 200 },
  { weight: 75, height: 100 },
  { weight: 500, height: 100 },
  { weight: 500, height: 250 },
  { weight: 0.000001, height: 250 },
];
// Sample actual eased-input paths too; all use the same true formula and shape builder.
const ends = values.slice();
for (const v of ends.slice(1))
  for (let j = 1; j < 5; j++)
    values.push({
      weight: bmiExample.weight + ((v.weight - bmiExample.weight) * j) / 5,
      height: bmiExample.height + ((v.height - bmiExample.height) * j) / 5,
    });
const samples = values.map((values) => {
  const R = scene(values);
  return { R, values, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R,
  solved = A.orderKeys(R.items, {
    ...samples[0].overlaps,
    pairs: samples.flatMap((s) => s.overlaps.pairs),
  });
if (solved.cycles.length || solved.dropped.length)
  throw Error(`Split geometry: ${JSON.stringify(solved.cycles)}; dropped ${solved.dropped.length}`);
for (const s of samples) {
  s.R.items.forEach((item, i) => (item.key = solved.keys[i]));
  s.R.settled = { items: s.R.items.slice(), overlaps: s.overlaps, solved, states: [0] };
  if (process.argv.includes('--audit')) {
    console.log('BMI platen pose', s.values);
    A.auditOrExit(s.R, P);
  }
}
if (process.exitCode) throw Error('BMI geometry audit failed');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/bmi-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 480,
    ...projection,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} BMI press solids across ${samples.length} sampled poses`);
