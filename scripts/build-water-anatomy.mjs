import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { waterPose, waterExample } from '../src/anatomy/water-model.ts';
import { waterBounds, waterSolid } from '../src/anatomy/water-solid.ts';
const base = { x: -158, y: -32, w: 316, d: 120, r: 7 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-134, -20, 90], [134, 24, 90]],
  680,
  410,
  { pad: 36, azimuth: 63, elevation: 31 },
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
  const pose = waterPose(values),
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
  for (const [i, x] of [-132, 104].entries()) {
    const p = { x, y: -22, w: 28, d: 48, r: 2 };
    slab(`chamber.foot${i}`, p, 0, 8, 'mid', screws(p, 8, 4));
  }
  box('chamber.floor', -134, -20, 268, 44, 8, 6);
  const back = { x: -134, y: -20, w: 268, d: 8, r: 0 };
  slab(
    'chamber.back',
    back,
    14,
    68,
    'mid',
    [34, 58].map((z) => L(k.sideSeam(back, z, P), { tone: 'faint' })).join(''),
  );
  box('chamber.left', -134, -12, 8, 30, 14, 68);
  box('chamber.rightStop', 126, -12, 8, 30, 14, 68);
  box('chamber.sill', -126, 12, 252, 6, 14, 6);
  box('chamber.crown', -134, -20, 268, 8, 82, 4);
  for (const [i, x] of [-135, 125].entries()) {
    const p = { x, y: -22, w: 10, d: 42, r: 1 };
    slab(`chamber.cap${i}`, p, 86, 2, 'mid', screws(p, 88, 2));
    box(`chamber.capSupport${i}`, x + 1, -12, 8, 30, 82, 4);
  }
  box('chamber.witnessRail', -134, 18, 268, 6, 14, 6);
  let ticks = '';
  for (let x = -126; x <= 114; x += 4)
    ticks += L(k.segment([x, 24.4, 20], [x, 24.4, 20 - ((x + 126) % 20 === 0 ? 4 : 2.5)], P), {
      tone: 'lo',
    });
  box('chamber.ruler', -126, 24, 252, 0.4, 14, 6, 'lo', ticks);
  for (const [kind, b] of Object.entries(waterBounds(pose))) {
    const [x, y, z, w, d, h] = b;
    put(
      `volume.${kind}`,
      [x + w / 2, y + d / 2, z + h / 2],
      waterSolid(projection, b, kind === 'extra'),
      A.slab({ x, y, w, d, r: 0 }, z, h, { name: `volume.${kind}` }),
      kind,
    );
  }
  const end = -126 + pose.totalLength,
    mark = -126 + pose.currentLength;
  box('end.wall', end, -12, 4, 24, 14, 64, 'mid', '', 'end');
  const cap = { x: end, y: -12, w: 4, d: 24, r: 0 };
  slab(
    'end.cap',
    cap,
    78,
    2,
    'mid',
    [-6, 6].map((y) => L(k.ring(end + 2, y, 0.7, 80, P, 24), { tone: 'lo' })).join(''),
    'end',
  );
  box('witness.foot', mark - 2, 20, 4, 4, 20, 2, 'mid', '', 'witness');
  box('witness.index', mark - 0.8, 22, 1.6, 2, 22, 54, 'mid', '', 'witness');
  for (const [i, x] of [-110, 0, 110].entries()) {
    const p = { x: x - 15, y: 54, w: 30, d: 22, r: 2 };
    slab(`control${i}.body`, p, 0, 8);
    slab(`control${i}.lid`, p, 8, 1, 'mid', screws(p, 9, 3));
    const F = G.frameAlong([x, 65, 9], [0, 0, 1]);
    for (const [name, z, h, radius, knurl] of [
      ['collar', 0, 2, 3, false],
      ['wheel', 2, 5, 7, true],
      ['dial', 7, 0.4, 5, false],
    ]) {
      put(
        `control${i}.${name}`,
        [x, 65, 9 + z + h / 2],
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
  const hatch = { x: 53, y: 31, w: 44, d: 14, r: 1 };
  slab('service.body', hatch, 0, 3);
  slab('service.lid', hatch, 3, 1, 'mid', screws(hatch, 4, 2));
  for (let i = 0; i < 3; i++)
    slab(`service.vent${i}`, { x: 61 + i * 10, y: 34, w: 3, d: 8, r: 0.5 }, 4, 0.3, 'lo');
  const plaque = { x: -122, y: 31, w: 86, d: 15, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-79, 40], 0.5, P), 'TBW × (Na / 140 − 1)', {
      size: 2.5,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5),
  );
  for (let i = 0; i < 3; i++)
    slab(`stand.rule${i}`, { x: -17, y: 31 + i * 5, w: 34 - i * 4, d: 2, r: 0.5 }, 0, 0.5, 'lo');
  return R;
}
const samples = [
  waterExample,
  { weight: 80, sodium: 170, bodyWaterFraction: 0.6 },
  { weight: 70, sodium: 180, bodyWaterFraction: 0.6 },
  { weight: 70, sodium: 170, bodyWaterFraction: 0.5 },
  { weight: 70, sodium: 140, bodyWaterFraction: 0.6 },
  { weight: 70, sodium: 140.001, bodyWaterFraction: 0.6 },
  { weight: 0.000001, sodium: 140, bodyWaterFraction: 0.000001 },
  { weight: 500, sodium: 170, bodyWaterFraction: 1 },
  { weight: 70, sodium: 1e6, bodyWaterFraction: 0.6 },
  { weight: 0.000001, sodium: 170, bodyWaterFraction: 0.6 },
].map((values) => {
  const R = scene(values);
  return { R, values, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R,
  solved = A.orderKeys(R.items, {
    ...samples[0].overlaps,
    pairs: samples.flatMap((s) => s.overlaps.pairs),
  });
if (solved.cycles.length || solved.dropped.length) {
  console.log(solved.cycles);
  throw Error(
    `Needs split geometry: ${solved.cycles.length} cycles, ${solved.dropped.length} dropped rules`,
  );
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
    console.log('Dilution chamber pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Dilution chamber audit failed; refusing generated art');
R.items.sort((a, b) => a.key - b.key);
const initial = waterPose(waterExample);
writeFileSync(
  new URL('../src/anatomy/water-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 410,
    ...projection,
    initialCurrentLength: initial.currentLength,
    initialTotalLength: initial.totalLength,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} dilution chamber parts`);
