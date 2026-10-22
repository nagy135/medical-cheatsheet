import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { calciumPose, calciumExample } from '../src/anatomy/calcium-model.ts';
const base = { x: -165, y: -30, w: 330, d: 122, r: 7 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-140, -16, 54], [140, 20, 54]],
  680,
  360,
  { pad: 36, azimuth: 63, elevation: 35 },
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
  const pose = calciumPose(values),
    R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static') =>
    R.put({ name, at: point, svg, group, piece: group, shapes: [R.solid(shape)] });
  const screws = (p, z, inset = 3) =>
    k
      .corners(p, inset)
      .map(
        ([x, y]) =>
          L(k.ring(x, y, 1.2, z, P, 24), { tone: 'lo' }) +
          k.dotsSvg([at([x, y, z])], { size: 0.4 }),
      )
      .join('');
  function slab(name, p, z, h, tone = 'mid', inner = '', group = 'static', lit = false) {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      S(k.slabOf(p, z, h, P, 8, Math.min(0.5, h / 3)), { tone, inner, lit }),
      A.slab(p, z, h, { name, owner: name }),
      group,
    );
  }
  const box = (name, x, y, w, d, z, h, tone = 'mid', inner = '', group = 'static') =>
    slab(name, { x, y, w, d, r: 0 }, z, h, tone, inner, group);
  for (const [i, [x, y]] of k.corners(base, 18).entries()) {
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
    L(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 9),
  );
  for (const [i, x] of [-145, 120].entries()) {
    const p = { x, y: -20, w: 25, d: 40, r: 2 };
    slab(`bed.foot${i}`, p, 0, 4, 'mid', screws(p, 4, 4));
  }
  box('bed.plate', -150, -16, 300, 32, 4, 8);
  for (const [i, y] of [-14, 8].entries()) box(`bed.rail${i}`, -146, y, 292, 6, 12, 6);
  for (const [i, x] of [-150, 146].entries()) box(`bed.stop${i}`, x, -16, 4, 32, 12, 10);
  for (const [i, x] of [-146, 138].entries())
    for (const [j, y] of [-20, 16].entries()) {
      const p = { x, y, w: 8, d: 4, r: 0.5 };
      slab(`bed.pad${i}${j}`, p, 4, 1, 'mid', screws(p, 5, 1.5));
    }
  const mainScale = { x: -146, y: 18, w: 292, d: 6, r: 0 };
  const ticks = k.topTicks(-140, 140, 5, 5, 18, 12.5, [2.5, 4], P);
  slab(
    'bed.scale',
    mainScale,
    12,
    0.5,
    'lo',
    L(ticks.minor, { tone: 'lo' }) + L(ticks.major, { tone: 'mid' }),
  );
  box('bed.scaleMount', -146, 18, 292, 6, 5, 7, 'lo');
  box('bed.zero', -71, 18, 2, 6, 12.5, 1, 'mid');
  box('bed.reference', 49, 18, 2, 6, 12.5, 1, 'mid');
  const m = pose.measuredX,
    r = pose.resultX;
  box('lower.shoe', m - 10, -16, 20, 32, 18, 2, 'mid', '', 'measured');
  box('lower.body', m - 10, -16, 20, 32, 20, 5, 'mid', '', 'measured');
  const lid = { x: m - 10, y: -16, w: 20, d: 32, r: 0 };
  slab('lower.cover', lid, 25, 1, 'mid', screws(lid, 26, 3), 'measured');
  box('lower.pointer', m - 1.5, 16, 3, 7, 20, 2, 'mid', '', 'measured');
  box('lower.witness', m - 0.8, -16, 1.6, 4, 26, 26, 'mid', '', 'measured');
  for (const [i, y] of [-10, 4].entries())
    box(`upper.rail${i}`, m - 60, y, 120, 6, 26, 6, 'mid', '', 'measured');
  for (const [i, x] of [m - 64, m + 60].entries())
    box(`upper.stop${i}`, x, -10, 4, 20, 26, 10, 'mid', '', 'measured');
  const ruler = { x: m - 60, y: -4, w: 120, d: 8, r: 0 };
  const upperTicks = k.topTicks(m - 60, m + 60, 4, 5, -4, 26.6, [2.5, 4], P);
  slab(
    'upper.ruler',
    ruler,
    26,
    0.6,
    'lo',
    L(upperTicks.minor, { tone: 'lo' }) + L(upperTicks.major, { tone: 'mid' }),
    'measured',
  );
  box('upper.zero', m - 0.6, -4, 1.2, 8, 26.6, 0.5, 'mid', '', 'measured');
  box('upper.shoe', r - 6, -12, 12, 24, 32, 2, 'mid', '', 'corrected');
  slab(
    'upper.head',
    { x: r - 6, y: -12, w: 12, d: 24, r: 0 },
    34,
    16,
    'mid',
    '',
    'corrected',
    true,
  );
  const head = { x: r - 6, y: -12, w: 12, d: 24, r: 0 };
  slab('upper.lid', head, 50, 2, 'mid', screws(head, 52, 2.5), 'corrected', true);
  slab(
    'upper.pointer',
    { x: r - 1.5, y: 12, w: 3, d: 6, r: 0 },
    35,
    2,
    'mid',
    '',
    'corrected',
    true,
  );
  for (const [i, x] of [-110, 110].entries()) {
    const p = { x: x - 15, y: 60, w: 30, d: 22, r: 2 };
    slab(`control${i}.body`, p, 0, 8);
    slab(`control${i}.lid`, p, 8, 1, 'mid', screws(p, 9, 3));
    const F = G.frameAlong([x, 71, 9], [0, 0, 1]);
    for (const [name, z, h, radius, knurl] of [
      ['collar', 0, 2, 3, false],
      ['wheel', 2, 5, 7, true],
      ['dial', 7, 0.4, 5, false],
    ]) {
      put(
        `control${i}.${name}`,
        [x, 71, 9 + z + h / 2],
        S(G.disc(z, z + h, radius, F, P), {
          tone: 'mid',
          inner: knurl
            ? k.fadedSvg(G.ribsOf(F, z, z + h, radius, 36, P, { seams: true, fade: [0.04, 0.4] }), {
                tone: 'lo',
              })
            : '',
        }),
        A.disc(F, z, z + h, radius, { name: `control${i}.${name}` }),
      );
    }
  }
  const hatch = { x: -29, y: 57, w: 58, d: 23, r: 2 };
  slab('service.body', hatch, 0, 4);
  slab('service.lid', hatch, 4, 1, 'mid', screws(hatch, 5));
  for (let i = 0; i < 4; i++)
    slab(`service.vent${i}`, { x: -21 + i * 12, y: 62, w: 4, d: 13, r: 1 }, 5, 0.35, 'lo');
  const plaque = { x: -143, y: 31, w: 72, d: 16, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-107, 41], 0.5, P), 'Ca + 0.02 (40 − Alb)', {
      size: 2.5,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5),
  );
  for (let i = 0; i < 3; i++)
    slab(`stand.rule${i}`, { x: -54, y: 31 + i * 6, w: 32 - i * 5, d: 2, r: 0.5 }, 0, 0.5, 'lo');
  return R;
}
const samples = [
  calciumExample,
  { calcium: 2.5, albumin: 30 },
  { calcium: 2.1, albumin: 20 },
  { calcium: 2.1, albumin: 40 },
  { calcium: 2.1, albumin: 50 },
  { calcium: 0.1, albumin: 100 },
  { calcium: 1.2, albumin: 100 },
  { calcium: 0.000001, albumin: 0.000001 },
  { calcium: 1e6, albumin: 100 },
  { calcium: 3.333333333, albumin: 0.000001 },
].map((values) => {
  const R = scene(values);
  return { R, values, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R,
  solved = A.orderKeys(R.items, {
    ...samples[0].overlaps,
    pairs: samples.flatMap((s) => s.overlaps.pairs),
  });
if (solved.cycles.length) console.log(JSON.stringify(solved.cycles, null, 2));
if (solved.cycles.length || solved.dropped.length)
  throw Error(
    `Needs split geometry: ${solved.cycles.length} cycles, ${solved.dropped.length} dropped rules`,
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
    console.log('Compound slide pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Compound slide audit failed; refusing generated art');
R.items.sort((a, b) => a.key - b.key);
const initial = calciumPose(calciumExample);
writeFileSync(
  new URL('../src/anatomy/calcium-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 360,
    ...projection,
    initialMeasuredX: initial.measuredX,
    initialResultX: initial.resultX,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} compound slide parts`);
