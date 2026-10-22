import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { horovitzPose, horovitzExample } from '../src/anatomy/horovitz-model.ts';
import { horovitzBounds, horovitzSolid } from '../src/anatomy/horovitz-solid.ts';
const base = { x: -148, y: -30, w: 296, d: 92, r: 7 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-128, -12, 112], [100, -8, 228]],
  680,
  480,
  { pad: 36, azimuth: 63, elevation: 27 },
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
  const pose = horovitzPose(values),
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
  function slab(name, p, z, h, tone = 'mid', inner = '', group = 'static') {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      S(k.slabOf(p, z, h, P, 8, Math.min(0.5, h / 3)), { tone, inner }),
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
  box('mixer.foot', -132, -16, 120, 34, 0, 12);
  box('mixer.back', -128, -12, 112, 6, 12, 100, 'lo');
  box('mixer.floor', -128, -6, 112, 16, 12, 14);
  box('mixer.left', -128, -6, 8, 16, 26, 78);
  box('mixer.right', -24, -6, 8, 16, 26, 78);
  box('mixer.crown', -128, -6, 112, 16, 104, 8);
  box('mixer.guide', -120, 10, 96, 2, 12, 14);
  for (const [i, x] of [-128, -24].entries()) {
    box(`mixer.mount${i}`, x, -14, 8, 2, 18, 12);
    const cap = { x: x - 1, y: -8, w: 10, d: 20, r: 1 };
    slab(`mixer.cap${i}`, cap, 112, 2, 'mid', screws(cap, 114, 2));
  }
  box('pressure.foot', 8, -12, 92, 30, 0, 12);
  box('pressure.back', 12, -8, 84, 4, 12, 208, 'lo');
  box('pressure.sill', 12, -4, 84, 14, 12, 12);
  for (const [i, [x, w]] of [
    [12, 8],
    [43, 22],
    [88, 8],
  ].entries())
    box(`pressure.stile${i}`, x, -4, w, 14, 24, 196);
  const crown = { x: 10, y: -8, w: 88, d: 20, r: 1 };
  slab('pressure.crown', crown, 220, 6, 'mid', screws(crown, 226, 4));
  for (const [i, x] of [12, 88].entries()) {
    box(`pressure.mount${i}`, x, -10, 8, 2, 18, 10);
    let ticks = '';
    for (let z = 24; z <= 204; z += 4.5)
      ticks += L(
        k.segment([x + 1, 10.4, z], [x + 1 + ((z - 24) % 22.5 === 0 ? 4 : 2.5), 10.4, z], P),
        { tone: 'lo' },
      );
    box(`pressure.ruler${i}`, x + 1, 10, 6, 0.4, 24, 180, 'lo', ticks);
  }
  for (const [kind, b] of Object.entries(horovitzBounds(pose))) {
    const [x, y, z, w, d, h] = b;
    put(
      `fill.${kind}`,
      [x + w / 2, y + d / 2, z + h / 2],
      horovitzSolid(projection, b, kind === 'result'),
      A.slab({ x, y, w, d, r: 0 }, z, h, { name: `fill.${kind}` }),
      kind,
    );
  }
  const carriages = [
    { x: -120 + pose.oxygenWidth, y: 12, z: 24, group: 'mixHandle' },
    { x: 16, y: 10.4, z: 24 + pose.heights[0], group: 'paHandle' },
    { x: 92, y: 10.4, z: 24 + pose.heights[1], group: 'resultHandle' },
  ];
  for (const [i, c] of carriages.entries()) {
    const p = { x: c.x - 4, y: c.y, w: 8, d: 6, r: 0 };
    slab(`drive${i}.carriage`, p, c.z - 4, 8, 'mid', '', c.group);
    slab(`drive${i}.lid`, p, c.z + 4, 1, 'mid', screws(p, c.z + 5, 2), c.group);
    if (i === 2) continue;
    const F = G.frameAlong([c.x, c.y + 6, c.z], [0, 1, 0]);
    put(
      `drive${i}.boss`,
      [c.x, c.y + 7, c.z],
      S(G.disc(0, 2, 2, F, P), { tone: 'mid' }),
      A.disc(F, 0, 2, 2, { name: `drive${i}.boss` }),
      c.group,
    );
    put(
      `drive${i}.wheel`,
      [c.x, c.y + 10, c.z],
      S(G.disc(2, 6, 3.5, F, P), {
        tone: 'mid',
        inner: k.fadedSvg(G.ribsOf(F, 2, 6, 3.5, 28, P, { seams: true, fade: [0.04, 0.4] }), {
          tone: 'lo',
        }),
      }),
      A.disc(F, 2, 6, 3.5, { name: `drive${i}.wheel` }),
      c.group,
    );
  }
  const hatch = { x: 40, y: 32, w: 64, d: 20, r: 2 };
  slab('service.body', hatch, 0, 4);
  slab('service.lid', hatch, 4, 1, 'mid', screws(hatch, 5));
  for (let i = 0; i < 4; i++)
    slab(`service.vent${i}`, { x: 48 + i * 12, y: 36, w: 4, d: 12, r: 1 }, 5, 0.35, 'lo');
  const plaque = { x: -116, y: 34, w: 72, d: 16, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-80, 44], 0.5, P), 'PaO₂ / FiO₂', {
      size: 3,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5),
  );
  for (let i = 0; i < 3; i++)
    slab(`stand.rule${i}`, { x: -28, y: 35 + i * 6, w: 34 - i * 4, d: 2, r: 0.5 }, 0, 0.5, 'lo');
  return R;
}
const samples = [
  horovitzExample,
  { pao2: 120, fio2: 40 },
  { pao2: 80, fio2: 80 },
  { pao2: 80, fio2: 100 },
  { pao2: 80, fio2: 21 },
  { pao2: 160, fio2: 80 },
  { pao2: 0.000001, fio2: 21 },
  { pao2: 1e6, fio2: 21 },
  { pao2: 1e6, fio2: 100 },
  { pao2: 80, fio2: 99.99 },
].map((values) => {
  const R = scene(values);
  return { R, values, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R,
  solved = A.orderKeys(R.items, {
    ...samples[0].overlaps,
    pairs: samples.flatMap((s) => s.overlaps.pairs),
  });
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
    console.log('Normierbank pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Normierbank audit failed; refusing generated art');
R.items.sort((a, b) => a.key - b.key);
const initial = horovitzPose(horovitzExample);
writeFileSync(
  new URL('../src/anatomy/horovitz-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 480,
    ...projection,
    initialOxygenWidth: initial.oxygenWidth,
    initialHeights: initial.heights,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} normalization bench parts`);
