import assert from 'node:assert/strict';
import * as k from '../docs/anatomy-map/vendor/iso-kit.mjs';
import * as G from '../docs/anatomy-map/vendor/lathe.mjs';
import * as A from '../docs/anatomy-map/vendor/audit.mjs';

import { mapPose, mapCalculator, pressureHeight } from '../src/anatomy/map-model.ts';
const calculate = mapCalculator.calculate;
const X = [-120, -40, 120];
const BASE = { x: -151, y: -34, w: 302, d: 88, r: 7 };
const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -18, 0),
    ...X.flatMap((x) => [
      [x - 15, -12, 181],
      [x + 15, 20, 181],
    ]),
  ],
  680,
  410,
  { pad: 42, azimuth: 68, elevation: 25 },
);
const FF = { o: [0, 10, 0], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] };
const S = k.solidSvg,
  L = k.lineSvg,
  D = k.dotsSvg;
const at = (point) => k.iso(point, P);
const front = (x, y, z) => ({ o: [x, y, z], a: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] });

function scene(values, audit = false, homeOrder = null) {
  const pose = mapPose(values);
  assert(pose);
  const zAt = (pressure) => pressureHeight(pressure, pose.scale);
  const R = A.recorder(P);
  let partCount = 0;
  function put(name, point, svg, shape, group = 'static') {
    R.put({ name, piece: group, at: point, svg, shapes: [R.solid(shape)], group });
    partCount++;
  }
  function slab(name, plan, z, h, tone = 'mid', inner = '', group = 'static', lit = false) {
    const shape = A.slab(plan, z, h, { name, owner: name });
    put(
      name,
      [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
      S(k.slabOf(plan, z, h, P, 8, Math.min(0.65, h / 3)), { tone, inner, lit }),
      shape,
      group,
    );
  }
  function disc(name, F, a, b, r, tone = 'mid', inner = '', group = 'static', lit = false) {
    const point = G.pointOf(F, (a + b) / 2, 0, 0);
    put(
      name,
      point,
      S(G.disc(a, b, r, F, P), { tone, inner, lit }),
      A.disc(F, a, b, r, { name, owner: name }),
      group,
    );
  }
  function screw(x, y, z, size = 1.65) {
    return (
      L(k.ring(x, y, size, z, P, 24), { tone: 'lo' }) +
      D([at([x, y, z])], { size: 0.5, tone: 'hi' })
    );
  }
  const footPlan = (x, y, w) => ({ x: x - w / 2, y: y - w / 2, w, d: w, r: 2 });
  for (const [i, [x, y]] of k.corners(BASE, 20).entries()) {
    slab(`stand.pad${i}`, footPlan(x, y, 15), -18, 3, 'lo');
    slab(`stand.foot${i}`, footPlan(x, y, 12), -15, 6, 'lo');
  }
  slab('stand.sole', k.insetPlan(BASE, 2), -9, 2, 'lo');
  slab(
    'stand.plate',
    BASE,
    -7,
    7,
    'lo',
    L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: 'faint' }) +
      k
        .corners(BASE, 10)
        .map(([x, y]) => screw(x, y, 0))
        .join(''),
  );
  const label = { x: 55, y: 32, w: 68, d: 13, r: 1.5 };
  slab(
    'stand.label',
    label,
    0,
    0.7,
    'lo',
    k.faceTextSvg(k.topMatrix([89, 39.8], 0.7, P), '1 : 2 / MAP', {
      size: 3.6,
      tone: 'lo',
      anchor: 'middle',
    }) +
      screw(59, 38.5, 0.7, 1) +
      screw(119, 38.5, 0.7, 1),
  );
  const channels = [
    { x: -131, y: 34, w: 67, d: 2, r: 0.8 },
    { x: -131, y: 40, w: 45, d: 2, r: 0.8 },
    { x: -131, y: 46, w: 55, d: 2, r: 0.8 },
  ];
  for (const [i, plan] of channels.entries()) slab(`stand.rule${i}`, plan, 0, 0.35, 'lo');
  const pressures = [values.diastolic, calculate(values), values.systolic];
  X.forEach((x, index) => {
    const foot = { x: x - 17, y: -20, w: 34, d: 42, r: 2.5 };
    slab(
      `track${index}.foot`,
      foot,
      0,
      4,
      'mid',
      [-12, 12].map((dx) => screw(x + dx, 14, 4)).join(''),
    );
    const spine = { x: x - 12, y: -12, w: 24, d: 7, r: 1 };
    slab(`track${index}.spine`, spine, 4, 173, 'mid');
    for (const dx of [-12, 9])
      slab(`track${index}.rail${dx}`, { x: x + dx, y: -5, w: 3, d: 2, r: 0.4 }, 4, 173, 'mid');
    let ticks = '';
    for (let p = 20; p <= 240; p += 5) {
      const len = p % 20 === 0 ? 5 : p % 10 === 0 ? 3.6 : 2.4;
      ticks += L(
        k.segment([x - 8, -4, pressureHeight(p)], [x - 8 + len, -4, pressureHeight(p)], P),
        {
          tone: p % 20 === 0 ? 'mid' : 'lo',
        },
      );
    }
    slab(`track${index}.scale`, { x: x - 8, y: -5, w: 16, d: 1, r: 0 }, 4, 173, 'lo', ticks);
    slab(
      `track${index}.top`,
      { x: x - 14, y: -14, w: 28, d: 13, r: 1 },
      177,
      4,
      'mid',
      [x - 9, x + 9].map((cx) => screw(cx, -7, 181, 1.2)).join(''),
    );
    slab(`track${index}.lower-stop`, { x: x - 9, y: -4, w: 18, d: 6, r: 0.8 }, 4, 6, 'mid');
    slab(`track${index}.upper-stop`, { x: x - 9, y: -4, w: 18, d: 6, r: 0.8 }, 169, 8, 'mid');
    const z = zAt(pressures[index]);
    const group = `slider${index}`;
    for (const dx of [-8, 5])
      slab(
        `${group}.bearing${dx}`,
        { x: x + dx, y: -4, w: 3, d: 2, r: 0 },
        z - 5,
        10,
        'lo',
        '',
        group,
      );
    slab(
      `${group}.body`,
      { x: x - 8, y: -2, w: 16, d: 9, r: 1 },
      z - 5,
      10,
      index === 1 ? 'hi' : 'mid',
      '',
      group,
      index === 1,
    );
    slab(
      `${group}.shoe`,
      { x: x - 7, y: 7, w: 14, d: 3, r: 0 },
      z - 4,
      9,
      index === 1 ? 'hi' : 'mid',
      '',
      group,
      index === 1,
    );
    const F = front(x, 14, z + 2.5);
    disc(`${group}.boss`, F, 0, 2.2, 4.5, index === 1 ? 'hi' : 'mid', '', group, index === 1);
    disc(`${group}.cap`, F, 2.2, 4, 3.5, index === 1 ? 'hi' : 'mid', '', group, index === 1);
    disc(`${group}.pin`, F, 4, 4.5, 1.1, 'mid', '', group);
    if (index !== 1) {
      slab(`${group}.lug`, { x: x - 4, y: 0, w: 8, d: 7, r: 0.6 }, z - 14, 9, 'mid', '', group);
      const knobF = front(x, 7, z - 10);
      disc(`${group}.shaft`, knobF, 0, 4, 1.8, 'mid', '', group);
      const ribs = k.fadedSvg(
        G.ribsOf(knobF, 4, 8, 4, 32, P, { fade: [0.03, 0.35], seams: true }),
        { tone: 'lo' },
      );
      disc(`${group}.thumbwheel`, knobF, 4, 8, 4, 'mid', ribs, group);
    }
  });
  const z0 = zAt(values.diastolic),
    z1 = zAt(values.systolic);
  const along = (x) => z0 + ((x + 120) / 240) * (z1 - z0);
  for (const [i, [from, to]] of [
    [-120, -40],
    [-40, 120],
  ].entries()) {
    const polygon = [
      [from, along(from)],
      [to, along(to)],
      [to, along(to) + 5],
      [from, along(from) + 5],
    ];
    const engraving = [];
    for (let x = from + 4; x < to; x += 4)
      engraving.push(
        L(k.segment([x, 14, along(x)], [x, 14, along(x) + (x % 20 === 0 ? 2.2 : 1.2)], P), {
          tone: 'lo',
        }),
      );
    put(
      `beam.section${i}`,
      [(from + to) / 2, 12, along((from + to) / 2) + 2.5],
      S(G.prismOf(FF, polygon, 0, 4, P), { tone: 'hi', inner: engraving.join('') }),
      A.prism(FF, polygon, 0, 4, { name: `beam.section${i}`, owner: `beam.section${i}` }),
      'beam',
    );
  }
  A.settle(R, P);
  if (homeOrder) for (const item of R.items) item.key = homeOrder.get(item.name);
  R.items.sort((a, b) => a.key - b.key);
  if (audit) A.auditOrExit(R, P);
  return {
    R,
    partCount,
    body: R.items
      .map((item) => `<g data-item="${item.name}" data-group="${item.group}">${item.svg}</g>`)
      .join(''),
  };
}

export { P, scene, BASE };
