import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import {
  osmolalityPose,
  osmolalityExample,
  osmolalityCenters,
} from '../src/anatomy/osmolality-model.ts';
import { osmolalityInserts, osmolalitySolid } from '../src/anatomy/osmolality-solid.ts';
const base = { x: -150, y: -38, w: 300, d: 131, r: 7 };
const P = k.fitProjection(
  [...k.boxCorners(base, -16, 0), [-126, -20, 114], [126, 10, 114]],
  700,
  430,
  { pad: 32, azimuth: 64, elevation: 33 },
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
  const R = A.recorder(P),
    pose = osmolalityPose(values);
  const put = (name, point, svg, shape, group = 'static') =>
    R.put({ name, at: point, svg, group, piece: group, shapes: [R.solid(shape)] });
  const screws = (p, z, inset = 3) =>
    k
      .corners(p, inset)
      .map(
        ([x, y]) =>
          L(k.ring(x, y, 0.9, z, P, 24), { tone: 'lo' }) +
          k.dotsSvg([at([x, y, z])], { size: 0.35 }),
      )
      .join('');
  function slab(name, p, z, h, tone = 'mid', inner = '') {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      S(k.slabOf(p, z, h, P, 8, Math.min(0.4, h / 3)), { tone, inner }),
      A.slab(p, z, h, { name, owner: name }),
    );
  }
  const box = (name, x, y, w, d, z, h, tone = 'mid', inner = '') =>
    slab(name, { x, y, w, d, r: 0 }, z, h, tone, inner);
  function prism(name, x, polygon, back, front, z = 46, tone = 'mid') {
    const F = { o: [x, 0, z], a: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] };
    put(
      name,
      [x, (back + front) / 2, z + 32],
      S(G.prismOf(F, polygon, -front, -back, P), { tone }),
      A.prism(F, polygon, -front, -back, { name, owner: name }),
    );
  }
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
      A.disc(F, 0, h, r, { name, owner: name }),
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
    L(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 10),
  );
  for (const [i, x] of [-133, 123].entries()) {
    const p = { x: x - 3, y: -32, w: 16, d: 16, r: 2 };
    slab(`frame.shoe${i}`, p, 0, 4, 'mid', screws(p, 4, 3));
    box(`frame.post${i}`, x, -29, 10, 10, 4, 36);
    box(`frame.cap${i}`, x - 1, -30, 12, 12, 40, 2);
  }
  box(
    'frame.bridge',
    -133,
    -30,
    266,
    10,
    42,
    4,
    'mid',
    L(k.sideSeam({ x: -133, y: -30, w: 266, d: 10, r: 0 }, 44, P), { tone: 'faint' }),
  );
  for (const [i, x] of osmolalityCenters.entries()) {
    // The cutaway has an open front. Every sheet is a genuine nonoverlapping prism.
    prism(
      `hopper${i}.back`,
      x,
      [
        [-7, 0],
        [7, 0],
        [21, 64],
        [-21, 64],
      ],
      -20,
      -18,
    );
    prism(
      `hopper${i}.left`,
      x,
      [
        [-7, 0],
        [-5, 0],
        [-19, 64],
        [-21, 64],
      ],
      -18,
      10,
    );
    prism(
      `hopper${i}.right`,
      x,
      [
        [5, 0],
        [7, 0],
        [21, 64],
        [19, 64],
      ],
      -18,
      10,
    );
    box(`hopper${i}.throat`, x - 7, -20, 14, 30, 44, 2);
    box(
      `hopper${i}.gate`,
      x - 9,
      -16,
      18,
      22,
      37,
      7,
      'mid',
      L(k.sideSeam({ x: x - 9, y: -16, w: 18, d: 22, r: 0 }, 40, P), { tone: 'faint' }),
    );
    disc(`hopper${i}.outlet`, x, -5, 30, 7, 4);
    box(`hopper${i}.rib`, x - 14, -22, 28, 2, 86, 2, 'mid');
    box(
      `hopper${i}.lip`,
      x - 21,
      -20,
      42,
      2,
      110,
      2,
      'mid',
      [-18, 18].map((dx) => L(k.ring(x + dx, -19, 0.5, 112, P, 20), { tone: 'lo' })).join(''),
    );
  }
  box('sodium.link', -95, -8, 32, 4, 39, 2, 'mid');
  // The shared tray is the additive receiver, with a low front lip for the cutaway.
  box('receiver.floor', -130, 14, 260, 30, 0, 6, 'mid');
  box('receiver.left', -130, 14, 4, 30, 6, 18);
  box('receiver.right', 126, 14, 4, 30, 6, 18);
  box('receiver.front', -126, 40, 252, 4, 6, 4);
  let ticks = '';
  for (let x = -126; x <= 126; x += 4)
    ticks += L(k.segment([x, 44.5, 12], [x, 44.5, 12 - ((x + 126) % 20 === 0 ? 2 : 1)], P), {
      tone: 'lo',
    });
  box('receiver.ruler', -126, 44, 252, 0.5, 6, 6, 'lo', ticks);
  for (const b of osmolalityInserts(pose)) {
    const F = { o: [b.x, 0, b.z], a: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] };
    put(
      `insert.${b.name}`,
      [b.x, (b.back + b.front) / 2, b.z],
      osmolalitySolid(projection, b),
      A.prism(F, b.polygon, -b.front, -b.back, { name: `insert.${b.name}`, owner: b.name }),
      b.name,
    );
  }
  for (const [i, x] of [-95, 10, 110].entries()) {
    const p = { x: x - 17, y: 62, w: 34, d: 24, r: 2 };
    slab(`control${i}.pedestal`, p, 0, 5, 'mid', screws(p, 5, 3));
    disc(`control${i}.spindle`, x, 74, 5, 3, 3);
    disc(`control${i}.wheel`, x, 74, 8, 5, i === 0 ? 11 : 8, true);
    disc(`control${i}.dial`, x, 74, 13, 0.5, i === 0 ? 8 : 5);
  }
  const plaque = { x: -48, y: 49, w: 76, d: 9, r: 1 };
  slab(
    'stand.label',
    plaque,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-10, 55], 0.5, P), '2 Na + Glukose + Harnstoff', {
      size: 2,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(plaque, 0.5, 2),
  );
  return R;
}
const values = [
  osmolalityExample,
  { sodium: 150, glucose: 100, urea: 5 },
  { sodium: 140, glucose: 360.364, urea: 5 },
  { sodium: 140, glucose: 100, urea: 20 },
  { sodium: 1e-6, glucose: 1e-6, urea: 1e-6 },
  { sodium: 1e6, glucose: 100, urea: 5 },
  { sodium: 140, glucose: 1e7, urea: 5 },
  { sodium: 140, glucose: 100, urea: 1e6 },
  ...Array.from({ length: 5 }, (_, i) => ({
    sodium: 140 + 2 * i,
    glucose: 100 + 52.0728 * i,
    urea: 5 + 3 * i,
  })),
];
const samples = values.map((v) => {
  const R = scene(v);
  return { R, values: v, overlaps: A.overlapsOf(R.items, P) };
});
const R = samples[0].R;
const solved = A.orderKeys(R.items, {
  ...samples[0].overlaps,
  pairs: samples.flatMap((s) => s.overlaps.pairs),
});
if (solved.cycles.length || solved.dropped.length) {
  console.log(JSON.stringify({ cycles: solved.cycles, dropped: solved.dropped }, null, 2));
  throw Error('Interlocking geometry requires splitting');
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
    console.log('Osmolality dosing bench', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Geometry audit failed');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/osmolality-art.json', import.meta.url),
  JSON.stringify({
    width: 700,
    height: 430,
    ...projection,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} dosing bench solids, ${samples.length} parameter poses`);
