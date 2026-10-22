import { writeFileSync } from 'node:fs';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';

const base = { x: -164, y: -100, w: 328, d: 224, r: 8 };
const P = k.fitProjection(k.boxCorners(base, -20, 38), 640, 360, {
  pad: 46,
  azimuth: 52,
  elevation: 38,
});
const S = k.solidSvg,
  L = k.lineSvg;
const at = (p) => k.iso(p, P);
const project = (p) => at(p).map((x) => Number(x.toFixed(3)));

function scene(x = 0, y = 0, homeOrder) {
  const R = A.recorder(P);
  const put = (name, at, svg, shape, group) =>
    R.put({ name, at, svg, group, piece: group, shapes: [R.solid(shape)] });
  function slab(name, plan, z, h, tone = 'mid', inner = '', group = 'static', lit = false) {
    put(
      name,
      [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
      S(k.slabOf(plan, z, h, P, 8, Math.min(0.6, h / 3)), { tone, inner, lit }),
      A.slab(plan, z, h, { name, owner: name }),
      group,
    );
  }
  function cylinder(
    name,
    cx,
    cy,
    r,
    z,
    h,
    tone = 'mid',
    inner = '',
    group = 'static',
    lit = false,
  ) {
    const F = G.frameAlong([cx, cy, z], [0, 0, 1]);
    put(
      name,
      [cx, cy, z + h / 2],
      S(G.disc(0, h, r, F, P), { tone, inner, lit }),
      A.disc(F, 0, h, r, { name, owner: name }),
      group,
    );
  }
  const screws = (plan, z, inset = 3) =>
    k
      .corners(plan, inset)
      .map(
        ([x, y]) =>
          L(k.ring(x, y, 1.2, z, P, 24), { tone: 'lo' }) +
          k.dotsSvg([at([x, y, z])], { size: 0.45 }),
      )
      .join('');
  for (const [i, [cx, cy]] of k.corners(base, 22).entries()) {
    slab(`stand.pad${i}`, { x: cx - 7, y: cy - 7, w: 14, d: 14, r: 2 }, -20, 3, 'lo');
    slab(`stand.foot${i}`, { x: cx - 5.5, y: cy - 5.5, w: 11, d: 11, r: 1.5 }, -17, 5, 'lo');
  }
  slab('stand.sole', k.insetPlan(base, 2), -12, 3, 'lo');
  slab(
    'stand.base',
    base,
    -9,
    9,
    'lo',
    L(k.planOutline(k.insetPlan(base, 5), 0, P), { tone: 'faint' }) + screws(base, 0, 10),
  );
  const bed = { x: -125, y: -65, w: 250, d: 130, r: 1 };
  slab('bed', bed, 0, 1, 'mid');
  const paper = { x: -123, y: -63, w: 246, d: 126, r: 0 };
  let grid = '';
  for (let gx = -112; gx <= 112; gx += 14)
    grid += L(k.segment([gx, -63, 1.4], [gx, 63, 1.4], P), { tone: 'faint' });
  for (let gy = -56; gy <= 56; gy += 14)
    grid += L(k.segment([-123, gy, 1.4], [123, gy, 1.4], P), { tone: 'faint' });
  slab('paper', paper, 1, 0.4, 'lo', grid);
  for (const [i, plan] of [
    { x: -127, y: -67, w: 254, d: 2, r: 0 },
    { x: -127, y: 65, w: 254, d: 2, r: 0 },
    { x: -127, y: -65, w: 2, d: 130, r: 0 },
    { x: 125, y: -65, w: 2, d: 130, r: 0 },
  ].entries())
    slab(`bezel${i}`, plan, 0, 2, 'mid');
  for (const [i, [cx, cy]] of [
    [-118, -58],
    [118, -58],
    [-118, 58],
    [118, 58],
  ].entries()) {
    const clip = { x: cx - 4, y: cy - 4, w: 8, d: 8, r: 1 };
    slab(`paper.clip${i}`, clip, 1.4, 1.6, 'mid', L(k.ring(cx, cy, 1, 3, P, 20), { tone: 'lo' }));
  }
  for (const cx of [-139, 139]) {
    for (const cy of [-70, 70])
      slab(`rail${cx}.pedestal${cy}`, { x: cx - 7, y: cy - 7, w: 14, d: 14, r: 1 }, 0, 6, 'mid');
    slab(`rail${cx}`, { x: cx - 3, y: -83, w: 6, d: 166, r: 0 }, 6, 4, 'hi');
    for (const cy of [-86, 86]) {
      const plan = { x: cx - 9, y: cy - 3, w: 18, d: 6, r: 1 };
      slab(`rail${cx}.stop${cy}`, plan, 0, 14, 'mid', screws(plan, 14, 2));
    }
    const motor = { x: cx - 9, y: 99, w: 18, d: 18, r: 1.4 };
    slab(`motor${cx}.mount`, k.insetPlan(motor, -2), 0, 2, 'lo');
    let vents = '';
    for (let d = 4; d <= 14; d += 3)
      vents += L(k.planOutline({ x: cx - 5, y: 99 + d, w: 10, d: 1, r: 0.5 }, 12, P), {
        tone: 'lo',
      });
    slab(`motor${cx}`, motor, 2, 10, 'mid', vents);
    const ruler = { x: cx + (cx < 0 ? -16 : 10), y: -77, w: 6, d: 154, r: 0 };
    const ticks = k.topTicks(-74, 74, 4, 5, ruler.x, 0.5, [2, 4], P, 'y');
    slab(
      `ruler${cx}`,
      ruler,
      0,
      0.5,
      'lo',
      L(ticks.minor, { tone: 'lo' }) + L(ticks.major, { tone: 'mid' }),
    );
    const moving = { x: cx - 7, y: y - 6, w: 14, d: 12, r: 0 };
    slab(`gantry${cx}.pad`, moving, 10, 2, 'lo', '', 'gantry');
    slab(`gantry${cx}.shoe`, moving, 12, 14, 'mid', '', 'gantry');
    slab(
      `gantry${cx}.lid`,
      k.insetPlan(moving, -1),
      26,
      2,
      'mid',
      screws(k.insetPlan(moving, -1), 28),
      'gantry',
    );
  }
  const beam = { x: -132, y: y - 3, w: 264, d: 6, r: 0 };
  const beamTicks = k.topTicks(-128, 128, 4, 5, y - 3, 26, [1.4, 3], P);
  slab(
    'gantry.beam',
    beam,
    22,
    4,
    'hi',
    L(beamTicks.minor, { tone: 'lo' }) + L(beamTicks.major, { tone: 'mid' }),
    'gantry',
  );
  const head = { x: x - 8, y: y + 3, w: 16, d: 10, r: 0.8 };
  slab('pen.head', head, 20, 10, 'hi', '', 'pen', true);
  slab('pen.cap', head, 30, 2, 'hi', screws(head, 32), 'pen', true);
  for (const dx of [-9.5, 8])
    slab(`pen.bearing${dx}`, { x: x + dx, y: y + 3, w: 1.5, d: 10, r: 0 }, 22, 6, 'mid', '', 'pen');
  cylinder('pen.barrel', x, y + 8, 2, 3, 17, 'hi', '', 'pen', true);
  cylinder('pen.tip', x, y + 8, 0.65, 1.4, 1.6, 'hi', '', 'pen', true);
  const knobF = G.frameAlong([x, y + 13, 25], [0, 1, 0]);
  put(
    'pen.boss',
    [x, y + 14, 25],
    S(G.disc(0, 2, 2.3, knobF, P), { tone: 'mid' }),
    A.disc(knobF, 0, 2, 2.3, { name: 'pen.boss' }),
    'pen',
  );
  put(
    'pen.knob',
    [x, y + 17, 25],
    S(G.disc(2, 5, 3.2, knobF, P), {
      tone: 'mid',
      inner: k.fadedSvg(G.ribsOf(knobF, 2, 5, 3.2, 26, P, { seams: true, fade: [0.04, 0.4] }), {
        tone: 'lo',
      }),
    }),
    A.disc(knobF, 2, 5, 3.2, { name: 'pen.knob' }),
    'pen',
  );
  const controller = { x: 57, y: 88, w: 60, d: 24, r: 2 };
  slab('controller', controller, 0, 8, 'mid');
  slab('controller.lid', controller, 8, 2, 'mid', screws(controller, 10));
  cylinder('controller.knob-base', 100, 100, 5, 10, 2, 'mid');
  cylinder(
    'controller.knob',
    100,
    100,
    4,
    12,
    3,
    'mid',
    L(k.knurl(100, 100, 4, 12, 15, 28, P), { tone: 'lo' }),
  );
  const label = { x: -100, y: 91, w: 52, d: 12, r: 1 };
  slab(
    'stand.label',
    label,
    0,
    0.5,
    'lo',
    k.faceTextSvg(k.topMatrix([-74, 99], 0.5, P), 'X / Y', {
      size: 3.2,
      anchor: 'middle',
      tone: 'lo',
    }) + screws(label, 0.5),
  );
  A.settle(R, P);
  if (homeOrder) for (const item of R.items) item.key = homeOrder.get(item.name);
  R.items.sort((a, b) => a.key - b.key);
  if (process.argv.includes('--audit')) A.auditOrExit(R, P);
  return R;
}

const R = scene();
const homeOrder = new Map(R.items.map((item, i) => [item.name, i]));
if (process.argv.includes('--audit'))
  for (const x of [-105, 0, 105])
    for (const y of [-58, -8, 42]) {
      console.log(`Plotter pose x=${x}, y=${y}`);
      scene(x, y, homeOrder);
    }
const origin = project([0, 0, 0]);
const vector = (v) => project(v).map((n, i) => Number((n - origin[i]).toFixed(6)));
const art = {
  width: 640,
  height: 360,
  partCount: R.items.length,
  origin,
  xVector: vector([1, 0, 0]),
  yVector: vector([0, 1, 0]),
  zVector: vector([0, 0, 1]),
  halo: `<path class="iso-halo" d="${k.haloOf(base, -20, 12, P)}"/>`,
  parts: R.items.map((item) => ({ name: item.name, group: item.group, svg: item.svg })),
};
writeFileSync(new URL('../src/anatomy/plotter-art.json', import.meta.url), JSON.stringify(art));
writeFileSync(new URL('../src/anatomy/iso.css', import.meta.url), k.ISO_CSS);
console.log(`Generated ${R.items.length} plotter parts`);
