import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { fenaPose, fenaExample, fenaInputs, fenaPositions } from '../src/anatomy/fena-model.ts';
import { fenaColumn } from '../src/anatomy/fena-solid.ts';

const base = { x: -148, y: -38, w: 296, d: 108, r: 9 };
const P = k.fitProjection(
  [...k.boxCorners(base, -14, 0), [-128, -24, 105], [126, 12, 105]],
  680,
  410,
  { pad: 32, azimuth: 64, elevation: 26 },
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
  const pose = fenaPose(values),
    R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static', field = '') =>
    R.put({ name, at: point, svg, group, field, shapes: [R.solid(shape)] });
  function slab(name, p, z, h, tone = 'mid', inner = '') {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      S(k.slabOf(p, z, h, P, 8, Math.min(0.5, h / 3)), { tone, inner }),
      A.slab(p, z, h, { name }),
    );
  }
  function round(name, x, y, z, h, r, tone = 'mid', inner = '', group = 'static', field = '') {
    const F = G.frameAlong([x, y, 0], [0, 0, 1]);
    put(
      name,
      [x, y, z + h / 2],
      S(G.disc(z, z + h, r, F, P, { smooth: { slope: () => 0 } }), { tone, inner }),
      A.disc(F, z, z + h, r, { name }),
      group,
      field,
    );
  }
  const screws = (p, z, inset = 3) =>
    k
      .corners(p, inset)
      .map(([x, y]) => L(k.ring(x, y, 1, z, P, 24)) + k.dotsSvg([at([x, y, z])], { size: 0.35 }))
      .join('');
  for (const [i, [x, y]] of k.corners(base, 18).entries()) {
    round(`stand.pad${i}`, x, y, -14, 2, 7, 'lo');
    round(`stand.foot${i}`, x, y, -12, 5, 5, 'lo');
  }
  slab('stand.sole', k.insetPlan(base, 2), -7, 2, 'lo');
  slab(
    'stand.deck',
    base,
    -5,
    5,
    'lo',
    L(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 9),
  );
  for (const [i, x] of [-128, 22].entries()) {
    const p = { x, y: -30, w: 100, d: 44, r: 5 };
    slab(`pair${i}.pedestal`, p, 0, 7, 'mid', L(k.sideSeam(p, 3, P), { tone: 'faint' }));
    slab(`pair${i}.lid`, p, 7, 1, 'mid', screws(p, 8, 5));
  }
  for (const [i, field] of fenaInputs.entries()) {
    const [x, y] = fenaPositions[field],
      h = pose.heights[field];
    round(`${field}.seat`, x, y, 8, 3, 13, 'mid');
    round(
      `${field}.cup`,
      x,
      y,
      11,
      5,
      10.5,
      'hi',
      L(k.sideArc(x, y, 10.5, 13, P, 48), { tone: 'faint' }),
    );
    const spine = { x: x + 12, y: -17, w: 6, d: 5, r: 0.5 };
    slab(`${field}.spine`, spine, 8, 91, 'mid');
    let ticks = '';
    for (let z = 16; z <= 92; z += 3.8)
      ticks += L(
        k.segment(
          [x + 18, -11.5, z],
          [x + 18 - (Math.round((z - 16) / 3.8) % 5 === 0 ? 6 : 2.5), -11.5, z],
          P,
        ),
        { tone: 'lo' },
      );
    slab(`${field}.scale`, { x: x + 12, y: -12, w: 6, d: 0.5, r: 0 }, 16, 76, 'lo', ticks);
    const head = { x: x - 13, y: -19, w: 31, d: 23, r: 2 };
    slab(`${field}.crosshead`, head, 99, 3, 'mid');
    slab(`${field}.headCap`, head, 102, 1, 'mid', screws(head, 103, 3));
    // A zero concentration has no sample solid, in drawing or audit.
    if (h > 0)
      put(
        `${field}.sample`,
        [x, y, 16 + h / 2],
        fenaColumn(P, x, y, h),
        A.cylinder(x, y, 8.5, 16, h, { name: `${field}.sample` }),
        'sample',
        field,
      );
    round(
      `${field}.meniscus`,
      x,
      y,
      16 + h,
      1.6,
      9.5,
      'hi',
      i % 2 ? L(k.ring(x, y, 6.5, 17.6 + h, P, 48), { tone: 'lo' }) : '',
      'cap',
      field,
    );
  }
  for (const [i, x] of [-117, -39, 39, 117].entries()) {
    const p = { x: x - 15, y: 38, w: 30, d: 22, r: 3 };
    slab(`adjuster${i}.body`, p, 0, 5);
    slab(`adjuster${i}.lid`, p, 5, 1, 'mid', screws(p, 6, 3));
    round(`adjuster${i}.spindle`, x, 49, 6, 2, 3);
    const F = G.frameAlong([x, 49, 0], [0, 0, 1]);
    round(
      `adjuster${i}.wheel`,
      x,
      49,
      8,
      5,
      8,
      'mid',
      k.fadedSvg(G.ribsOf(F, 8, 13, 8, 40, P, { seams: true, fade: [0.04, 0.4] }), { tone: 'lo' }),
    );
    round(
      `adjuster${i}.dial`,
      x,
      49,
      13,
      0.4,
      6,
      'hi',
      L(k.ring(x, 49, 4.5, 13.4, P, 48), { tone: 'lo' }),
    );
  }
  const hatch = { x: -18, y: 16, w: 36, d: 17, r: 2 };
  slab('service.body', hatch, 0, 3);
  slab('service.lid', hatch, 3, 0.7, 'mid', screws(hatch, 3.7, 2.5));
  for (let i = 0; i < 3; i++)
    slab(`service.vent${i}`, { x: -10 + i * 8, y: 20, w: 2.5, d: 8, r: 1 }, 3.7, 0.3, 'lo');
  const plaque = { x: -112, y: 19, w: 70, d: 10, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-77, 25], 0.5, P), 'U/S · Na ÷ Cr', {
      size: 3,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5, 2),
  );
  for (const [i, x] of [56, 98].entries())
    slab(
      `retainer${i}`,
      { x, y: 22, w: 10, d: 7, r: 1 },
      0,
      2,
      'mid',
      L(k.ring(x + 5, 25.5, 1, 2, P, 24)),
    );
  return R;
}
const values = [
  fenaExample,
  { ...fenaExample, sodium: 280 },
  { ...fenaExample, urineSodium: 40 },
  { ...fenaExample, creatinine: 2 },
  { ...fenaExample, urineCreatinine: 200 },
  { ...fenaExample, urineSodium: 0 },
  { sodium: 140, urineSodium: 140, creatinine: 100, urineCreatinine: 100 },
  { sodium: 1e-6, urineSodium: 1e6, creatinine: 1e6, urineCreatinine: 1e-6 },
  { sodium: 1e6, urineSodium: 0, creatinine: 1e-6, urineCreatinine: 1e6 },
  { sodium: 100, urineSodium: 200, creatinine: 100, urineCreatinine: 50 },
  { sodium: 120, urineSodium: 90, creatinine: 50, urineCreatinine: 75 },
];
const samples = values.map((v) => {
  const R = scene(v);
  return { R, values: v, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R;
const masterIndex = new Map(R.items.map((item, i) => [item.name, i]));
const solved = A.orderKeys(R.items, {
  ...samples[0].overlaps,
  pairs: samples.flatMap((s) =>
    s.overlaps.pairs.map((pair) => ({
      ...pair,
      a: masterIndex.get(s.R.items[pair.a].name),
      b: masterIndex.get(s.R.items[pair.b].name),
    })),
  ),
});
if (solved.cycles.length || solved.dropped.length)
  throw Error(
    `Geometry needs splitting: ${JSON.stringify(solved.cycles)}; ${solved.dropped.length} dropped rules`,
  );
for (const sample of samples) {
  sample.R.items.forEach((item) => (item.key = solved.keys[masterIndex.get(item.name)]));
  sample.R.settled = {
    items: sample.R.items.slice(),
    overlaps: sample.overlaps,
    solved: { ...solved, keys: sample.R.items.map((item) => item.key) },
    states: [0],
  };
  if (process.argv.includes('--audit')) {
    console.log('FENa comparator pose', sample.values);
    const clearance = A.solidClearances(sample.R.solids);
    console.log(`solid clearances at rest: ${clearance.length}`);
    if (clearance.length) {
      console.log(clearance);
      process.exitCode = 1;
    }
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('FENa comparator audit failed; refusing generated art');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/fena-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 410,
    camera: P,
    ...projection,
    initialHeights: fenaPose(fenaExample).heights,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -14, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, field: i.field, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} FENa comparator parts`);
