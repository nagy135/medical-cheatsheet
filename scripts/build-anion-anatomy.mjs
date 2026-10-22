import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { anionPose, anionExample } from '../src/anatomy/anion-model.ts';
import { anionBounds, anionSolid } from '../src/anatomy/anion-solid.ts';
const base = { x: -142, y: -27, w: 284, d: 82, r: 7 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-126, -18, 232], [126, 20, 232]],
  680,
  490,
  { pad: 36, azimuth: 63, elevation: 25 },
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
  const pose = anionPose(values);
  if (!pose) throw Error('Invalid anion cabinet pose');
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
  function slab(name, plan, z, h, tone = 'mid', inner = '', group = 'static') {
    put(
      name,
      [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
      S(k.slabOf(plan, z, h, P, 8, Math.min(0.6, h / 3)), { tone, inner }),
      A.slab(plan, z, h, { name, owner: name }),
      group,
    );
  }
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
  for (const [i, x] of [-126, 96].entries()) {
    const plan = { x, y: -18, w: 30, d: 32, r: 2 };
    slab(`case.foot${i}`, plan, 0, 12, 'mid', screws(plan, 12, 4));
  }
  slab(
    'case.back',
    { x: -110, y: -15, w: 220, d: 5, r: 0 },
    12,
    208,
    'lo',
    [70, 130, 190]
      .map((z) => L(k.sideSeam({ x: -110, y: -15, w: 220, d: 5, r: 0 }, z, P), { tone: 'faint' }))
      .join(''),
  );
  slab('case.left', { x: -120, y: -15, w: 10, d: 25, r: 0 }, 12, 208, 'mid');
  slab('case.right', { x: 110, y: -15, w: 10, d: 25, r: 0 }, 12, 208, 'mid');
  slab('case.floor', { x: -110, y: -10, w: 220, d: 20, r: 0 }, 12, 8, 'mid');
  slab('case.center', { x: -14, y: -10, w: 28, d: 20, r: 0 }, 20, 200, 'mid');
  const crown = { x: -120, y: -15, w: 240, d: 25, r: 1 };
  slab('case.crown', crown, 220, 8, 'mid', screws(crown, 228, 5));
  for (const [i, x] of [-123, 107].entries()) {
    const cap = { x, y: -17, w: 16, d: 29, r: 1 };
    slab(`case.cap${i}`, cap, 228, 3, 'mid', screws(cap, 231));
  }
  for (const [i, x] of [-122, 120].entries())
    slab(`case.trim${i}`, { x, y: -12, w: 2, d: 24, r: 0 }, 20, 196, 'mid');
  // Mounting pads sit behind the outer stiles, clear of the carriage travel.
  for (const [i, x] of [-120, 110].entries())
    for (const [j, z] of [14, 210].entries())
      slab(`case.mount${i}${j}`, { x, y: -17, w: 10, d: 2, r: 0.5 }, z, 6, 'mid');
  let ticks = '';
  for (let z = 24; z <= 216; z += 4)
    ticks += L(k.segment([-12, 10.4, z], [-12 + (z % 20 === 0 ? 5 : 3), 10.4, z], P), {
      tone: z % 20 === 0 ? 'mid' : 'lo',
    });
  slab('case.ruler', { x: -12, y: 10, w: 10, d: 0.4, r: 0 }, 20, 196, 'lo', ticks);
  for (const [kind, bounds] of Object.entries(anionBounds(pose))) {
    const [x, y, z, w, d, h] = bounds;
    put(
      `cassette.${kind}`,
      [x + w / 2, y + d / 2, z + h / 2],
      anionSolid(projection, bounds, kind === 'gap'),
      A.slab({ x, y, w, d, r: 0 }, z, h, { name: `cassette.${kind}` }),
      kind,
    );
  }
  const stops = [pose.heights[0], pose.heights[1], pose.totalHeight];
  for (const [i, cx] of [-115, 8, 115].entries()) {
    const z = 20 + stops[i],
      group = `input${i}`,
      body = { x: cx - 5, y: 10, w: 10, d: 6, r: 0 };
    slab(`drive${i}.carriage`, body, z - 4, 8, 'mid', '', group);
    slab(`drive${i}.lid`, body, z + 4, 1, 'mid', screws(body, z + 5, 2), group);
    const F = G.frameAlong([cx, 16, z], [0, 1, 0]);
    put(
      `drive${i}.boss`,
      [cx, 17, z],
      S(G.disc(0, 2, 2, F, P), { tone: 'mid' }),
      A.disc(F, 0, 2, 2, { name: `drive${i}.boss` }),
      group,
    );
    put(
      `drive${i}.wheel`,
      [cx, 20, z],
      S(G.disc(2, 6, 3.5, F, P), {
        tone: 'mid',
        inner: k.fadedSvg(G.ribsOf(F, 2, 6, 3.5, 28, P, { seams: true, fade: [0.04, 0.4] }), {
          tone: 'lo',
        }),
      }),
      A.disc(F, 2, 6, 3.5, { name: `drive${i}.wheel` }),
      group,
    );
  }
  const hatch = { x: 45, y: 27, w: 68, d: 20, r: 2 };
  slab('service.body', hatch, 0, 4, 'mid');
  slab('service.lid', hatch, 4, 1, 'mid', screws(hatch, 5));
  for (let i = 0; i < 4; i++)
    slab(`service.vent${i}`, { x: 54 + i * 12, y: 31, w: 4, d: 12, r: 1 }, 5, 0.35, 'lo');
  const plaque = { x: -112, y: 28, w: 76, d: 16, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-74, 38], 0.5, P), 'Na − Cl − HCO₃', {
      size: 3,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5),
  );
  for (const [i, plan] of [
    { x: -24, y: 30, w: 38, d: 2, r: 0.5 },
    { x: -24, y: 36, w: 28, d: 2, r: 0.5 },
    { x: -24, y: 42, w: 34, d: 2, r: 0.5 },
  ].entries())
    slab(`stand.rule${i}`, plan, 0, 0.5, 'lo');
  return R;
}
const samples = [];
for (const values of [
  anionExample,
  { ...anionExample, sodium: 150 },
  { ...anionExample, chloride: 114 },
  { ...anionExample, bicarbonate: 34 },
  { ...anionExample, sodium: 128 },
  { ...anionExample, sodium: 120 },
  { sodium: 0.000001, chloride: 0.000001, bicarbonate: 0.000001 },
  { sodium: 140, chloride: 1e6, bicarbonate: 1e6 },
  { sodium: 1e6, chloride: 1, bicarbonate: 1 },
  { sodium: 180, chloride: 0.000001, bicarbonate: 179.999999 },
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
    `Cabinet needs split geometry: ${solved.cycles.length} cycles, ${solved.dropped.length} dropped rules`,
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
    console.log('Cabinet pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Cabinet audit failed; refusing to replace generated art');
R.items.sort((a, b) => a.key - b.key);
const initial = anionPose(anionExample);
writeFileSync(
  new URL('../src/anatomy/anion-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 490,
    ...projection,
    initialStops: [initial.heights[0], initial.heights[1], initial.totalHeight],
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} cabinet parts`);
