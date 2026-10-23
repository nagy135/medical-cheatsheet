import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { pbwPose, pbwExample, pbwCenters } from '../src/anatomy/pbw-model.ts';
import { pbwMeasure } from '../src/anatomy/pbw-solid.ts';
const base = { x: -104, y: -96, w: 208, d: 222, r: 16 };
const P = k.fitProjection(
  [...k.boxCorners(base, -13, 0), ...k.boxCorners({ x: -80, y: -80, w: 160, d: 160, r: 0 }, 0, 88)],
  680,
  460,
  { pad: 34, azimuth: 48, elevation: 38 },
);
const at = (p) => k.iso(p, P),
  origin = at([0, 0, 0]);
const vector = (p) => at(p).map((v, i) => v - origin[i]);
const projection = {
  origin,
  xVector: vector([1, 0, 0]),
  yVector: vector([0, 1, 0]),
  zVector: vector([0, 0, 1]),
};
function scene(values) {
  const pose = pbwPose(values),
    R = A.recorder(P);
  const put = (name, point, svg, shape, group = 'static') =>
    R.put({ name, at: point, svg, group, piece: group, shapes: [R.solid(shape)] });
  function slab(name, p, z, h, inner = '', group = 'static') {
    put(
      name,
      [p.x + p.w / 2, p.y + p.d / 2, z + h / 2],
      k.solidSvg(k.slabOf(p, z, h, P, 8, Math.min(0.4, h / 3)), { tone: 'mid', inner }),
      A.slab(p, z, h, { name }),
      group,
    );
  }
  function disc(name, x, y, z, h, r, inner = '', group = 'static') {
    const F = G.frameAlong([x, y, 0], [0, 0, 1]);
    put(
      name,
      [x, y, z + h / 2],
      k.solidSvg(G.disc(z, z + h, r, F, P), { tone: 'mid', inner }),
      A.disc(F, z, z + h, r, { name }),
      group,
    );
  }
  function ring(name, x, y, z, h, ri, ro, inner = '') {
    const F = G.frameAlong([x, y, 0], [0, 0, 1]);
    put(
      name,
      [x, y, z + h / 2],
      // The kit's hull and hole wind alike; explicit evenodd keeps the real annular opening clear.
      k
        .solidSvg(G.ringBand(z, z + h, ri, ro, F, P, { hole: [z + h, ri] }), { tone: 'mid', inner })
        .replace('<path class="iso-fill"', '<path class="iso-fill" fill-rule="evenodd"'),
      A.ring(F, z, z + h, ri, ro, { name }),
    );
  }
  const screws = (p, z, inset = 4) =>
    k
      .corners(p, inset)
      .map(
        ([x, y]) =>
          k.lineSvg(k.ring(x, y, 1, z, P, 24), { tone: 'lo' }) +
          k.dotsSvg([at([x, y, z])], { size: 0.35 }),
      )
      .join('');
  for (const [i, [x, y]] of k.corners(base, 24).entries()) {
    disc(`stand.pad${i}`, x, y, -13, 3, 8);
    disc(`stand.foot${i}`, x, y, -10, 4, 6);
  }
  slab(
    'stand.plate',
    base,
    -6,
    6,
    k.lineSvg(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 13),
  );
  disc('bearing.drum', 0, 0, 0, 6, 68);
  disc('bearing.cap', 0, 0, 6, 2, 71);
  disc('carousel.deck', 0, 0, 8, 4, 84, k.lineSvg(k.ring(0, 0, 81, 12, P, 128), { tone: 'lo' }));
  disc('hub.foot', 0, 0, 12, 3, 14);
  disc('hub.spindle', 0, 0, 15, 65, 7);
  disc(
    'hub.cap',
    0,
    0,
    80,
    4,
    12,
    k.faceTextSvg(k.topMatrix([0, 0], 84, P), '×6', { size: 6, anchor: 'middle', tone: 'lo' }),
  );
  for (const [i, [x, y]] of pbwCenters.entries()) {
    disc(
      `chamber${i}.seat`,
      x,
      y,
      12,
      2,
      19,
      k.lineSvg(k.ring(x, y, 16.5, 14, P, 64), { tone: 'faint' }),
    );
    for (let j = 0; j < 3; j++) {
      const a = (j * 2 * Math.PI) / 3,
        px = x + 17 * Math.cos(a),
        py = y + 17 * Math.sin(a);
      disc(`chamber${i}.post${j}`, px, py, 14, 70, 1.3);
    }
    ring(
      `chamber${i}.collar`,
      x,
      y,
      84,
      2,
      15.5,
      19,
      k.dotsSvg(
        Array.from({ length: 3 }, (_, j) =>
          at([
            x + 17 * Math.cos((j * 2 * Math.PI) / 3),
            y + 17 * Math.sin((j * 2 * Math.PI) / 3),
            86,
          ]),
        ),
        { size: 0.5 },
      ),
    );
    const F = G.frameAlong([x, y, 0], [0, 0, 1]);
    put(
      `chamber${i}.measure`,
      [x, y, 14 + pose.measureHeight / 2],
      pbwMeasure(projection, x, y, pose.measureHeight),
      A.disc(F, 14, 14 + pose.measureHeight, 12, { name: `chamber${i}.measure` }),
      `measure${i}`,
    );
  }
  const wheel = { x: -70, y: 91, w: 36, d: 26, r: 4 };
  slab('height.body', wheel, 0, 4, screws(wheel, 4));
  disc('height.neck', -52, 104, 4, 3, 5);
  const F = G.frameAlong([-52, 104, 0], [0, 0, 1]);
  disc(
    'height.wheel',
    -52,
    104,
    7,
    6,
    12,
    k.fadedSvg(G.ribsOf(F, 7, 13, 12, 60, P, { seams: true, fade: [0.04, 0.4] }), { tone: 'lo' }),
  );
  const ticks = k.radialTicks(-52, 104, 9, 24, 4, 13.4, [1, 2], P);
  disc(
    'height.dial',
    -52,
    104,
    13,
    0.4,
    9,
    k.lineSvg(ticks.minor, { tone: 'lo' }) + k.lineSvg(ticks.major, { tone: 'mid' }),
  );
  const control = { x: 31, y: 91, w: 42, d: 26, r: 4 };
  slab('selector.body', control, 0, 4, screws(control, 4));
  slab(
    'selector.rail',
    { x: 35, y: 98, w: 34, d: 12, r: 2 },
    4,
    2,
    k.lineSvg(k.planOutline({ x: 39, y: 100, w: 26, d: 8, r: 1 }, 6, P), { tone: 'lo' }),
  );
  slab(
    'selector.shuttle',
    { x: pose.selectorX - 5, y: 99, w: 10, d: 10, r: 2 },
    6,
    3,
    '',
    'selector',
  );
  const plaque = { x: -23, y: 94, w: 46, d: 18, r: 2 };
  slab(
    'stand.label',
    plaque,
    0,
    0.6,
    screws(plaque, 0.6) +
      [0, 1, 2]
        .map((i) =>
          k.lineSvg(k.lineOnTop([-13, 99 + i * 4], [12 - i * 4, 99 + i * 4], 0.6, P), {
            tone: 'lo',
            free: true,
          }),
        )
        .join(''),
  );
  return R;
}
// Endpoints plus a dense sweep include the complete legal PBW stroke and both categorical poses.
const samples = [
  pbwExample,
  { height: 100, sex: 1 },
  { height: 102.400001, sex: 0 },
  { height: 102.5, sex: 0 },
  ...[0, 1].flatMap((sex) =>
    Array.from({ length: 17 }, (_, i) => ({ height: 103 + i * (147 / 16), sex })),
  ),
].filter((v) => pbwPose(v));
const scenes = samples.map((values) => {
  const R = scene(values);
  return { R, values, overlaps: A.overlapsOf(R.items, P) };
});
const R = scenes[0].R,
  solved = A.orderKeys(R.items, {
    ...scenes[0].overlaps,
    pairs: scenes.flatMap((s) => s.overlaps.pairs),
  });
if (solved.cycles.length || solved.dropped.length)
  throw Error(`Split required: ${JSON.stringify(solved.cycles)} / ${solved.dropped.length}`);
for (const s of scenes) {
  s.R.items.forEach((item, i) => (item.key = solved.keys[i]));
  s.R.settled = { items: s.R.items.slice(), overlaps: s.overlaps, solved, states: [0] };
  if (process.argv.includes('--audit')) {
    console.log('PBW pose', s.values);
    A.auditOrExit(s.R, P);
  }
}
if (process.exitCode) throw Error('PBW audit failed');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/pbw-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 460,
    ...projection,
    initialSelectorX: pbwPose(pbwExample).selectorX,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -13, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} true carousel solids`);
