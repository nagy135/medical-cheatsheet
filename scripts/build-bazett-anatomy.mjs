import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';
import { bazettPose, bazettExample } from '../src/anatomy/bazett-model.ts';
import { bazettShapes, bazettSolid, bazettTicks } from '../src/anatomy/bazett-solid.ts';
const base = { x: -147, y: -113, w: 294, d: 226, r: 9 };
const P = k.fitProjection([...k.boxCorners(base, -16, 0), [-94, -94, 40], [94, 94, 40]], 680, 470, {
  pad: 38,
  azimuth: 45,
  elevation: 40,
});
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
  const pose = bazettPose(values);
  if (!pose) throw Error('Invalid Bazett dial');
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
  function slab(name, plan, z, h, tone = 'mid', inner = '') {
    put(
      name,
      [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
      S(k.slabOf(plan, z, h, P, 8, Math.min(0.6, h / 3)), { tone, inner }),
      A.slab(plan, z, h, { name, owner: name }),
    );
  }
  function disc(name, x, y, z, r, h, inner = '', group = 'static', tone = 'mid') {
    const F = G.frameAlong([x, y, z], [0, 0, 1]);
    put(
      name,
      [x, y, z + h / 2],
      S(G.disc(0, h, r, F, P), { tone, inner }),
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
  disc('dial.foot', 0, 0, 0, 94, 3, '', 'static', 'lo');
  disc('dial.housing', 0, 0, 3, 91, 7, '', 'static', 'mid');
  disc('dial.shoulder', 0, 0, 10, 88, 2);
  disc('dial.carrier', 0, 0, 12, 84, 3);
  disc(
    'dial.scale',
    0,
    0,
    15,
    82,
    0.7,
    `<g data-bazett-ticks="outer">${bazettTicks(projection, pose)}</g>`,
  );
  disc(
    'dial.rotor',
    0,
    0,
    15.7,
    57,
    2,
    `<g data-bazett-ticks="inner">${bazettTicks(projection, pose, true)}</g>` +
      L(k.ring(0, 0, 35, 17.7, P, 80), { tone: 'faint' }),
  );
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2,
      x = 86 * Math.cos(angle),
      y = 86 * Math.sin(angle);
    disc(`dial.bolt${i}`, x, y, 12, 2, 1, screw(x, y, 13));
    const t = angle + pose.gainAngle,
      cx = 43 * Math.cos(t),
      cy = 43 * Math.sin(t);
    disc(`rotor.rivet${i}`, cx, cy, 17.7, 1.6, 0.5, '', `rivet${i}`);
  }
  disc('axis.lower', 0, 0, 17.7, 3, 7.3);
  for (const [name, shape] of Object.entries(bazettShapes(pose))) {
    put(
      `hand.${name}`,
      [0, 0, shape.z + shape.h / 2],
      bazettSolid(projection, shape, name === 'corrected'),
      A.prism(
        { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
        shape.points,
        shape.z,
        shape.z + shape.h,
        { name: `hand.${name}` },
      ),
      name,
    );
  }
  disc('axis.spacer', 0, 0, 27, 3, 4);
  disc('axis.cap', 0, 0, 33, 5, 2);
  const topF = G.frameAlong([0, 0, 35], [0, 0, 1]);
  disc(
    'axis.crown',
    0,
    0,
    35,
    3,
    4,
    k.fadedSvg(G.ribsOf(topF, 0, 4, 3, 28, P, { seams: true, fade: [0.04, 0.4] }), { tone: 'lo' }),
  );
  for (const [i, x] of [-112, 112].entries()) {
    const plan = { x: x - 17, y: 47, w: 34, d: 36, r: 3 };
    slab(`control${i}.body`, plan, 0, 8);
    slab(`control${i}.lid`, plan, 8, 2, 'mid', screws(plan, 10, 5));
    disc(`control${i}.pedestal`, x, 65, 10, 8, 2);
    const F = G.frameAlong([x, 65, 12], [0, 0, 1]);
    disc(
      `control${i}.wheel`,
      x,
      65,
      12,
      6,
      6,
      k.fadedSvg(G.ribsOf(F, 0, 6, 6, 40, P, { seams: true, fade: [0.04, 0.4] }), { tone: 'lo' }),
    );
  }
  for (const [i, [x, y]] of k.corners(base, 20).entries())
    disc(`stand.washer${i}`, x, y, 0, 3, 1, screw(x, y, 1));
  const vents = [
    { x: 60, y: -1.5, w: 12, d: 3, r: 1 },
    { x: -72, y: -1.5, w: 12, d: 3, r: 1 },
    { x: -6, y: 64.5, w: 12, d: 3, r: 1 },
    { x: -6, y: -67.5, w: 12, d: 3, r: 1 },
  ];
  vents.forEach((plan, i) => slab(`dial.vent${i}`, plan, 15.7, 0.25, 'lo'));
  const label = { x: -34, y: 96, w: 68, d: 12, r: 1 };
  slab(
    'stand.label',
    label,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([0, 104], 0.5, P), 'QT / √RR', {
      size: 3,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(label, 0.5),
  );
  for (const [i, plan] of [
    { x: -25, y: -108, w: 50, d: 2, r: 0.5 },
    { x: -20, y: -104, w: 40, d: 2, r: 0.5 },
    { x: -15, y: -100, w: 30, d: 2, r: 0.5 },
  ].entries())
    slab(`stand.rule${i}`, plan, 0, 0.5, 'lo');
  const service = { x: -104, y: -104, w: 40, d: 28, r: 2 };
  slab('service.body', service, 0, 3);
  slab('service.lid', service, 3, 1, 'mid', screws(service, 4));
  for (let i = 0; i < 3; i++)
    slab(`service.vent${i}`, { x: -96 + i * 9, y: -98, w: 4, d: 16, r: 1 }, 4, 0.3, 'lo');
  return R;
}
const samples = [];
for (const values of [
  bazettExample,
  { qt: 500, heartRate: 75 },
  { qt: 400, heartRate: 60 },
  { qt: 400, heartRate: 120 },
  { qt: 400, heartRate: 30 },
  { qt: 1500, heartRate: 350 },
  { qt: 0.000001, heartRate: 0.000001 },
  { qt: 1500, heartRate: 0.000001 },
  { qt: 0.000001, heartRate: 350 },
  { qt: 200, heartRate: 100 },
  { qt: 600, heartRate: 100 },
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
    `Bazett dial needs split geometry: ${solved.cycles.length} cycles, ${solved.dropped.length} dropped rules`,
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
    console.log('Bazett pose', sample.values);
    A.auditOrExit(sample.R, P);
  }
}
if (process.exitCode) throw Error('Bazett audit failed; refusing to replace generated art');
R.items.sort((a, b) => a.key - b.key);
writeFileSync(
  new URL('../src/anatomy/bazett-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 470,
    ...projection,
    initialGainAngle: bazettPose(bazettExample).gainAngle,
    halo: `<path class="iso-halo" d="${k.haloOf(base, -16, 10, P)}"/>`,
    parts: R.items.map((i) => ({ name: i.name, group: i.group, svg: i.svg })),
  }),
);
console.log(`Generated ${R.items.length} Bazett parts`);
