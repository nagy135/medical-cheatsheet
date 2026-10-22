import { writeFileSync } from 'node:fs';
import { iso, haloOf } from '../docs/anatomy-map/vendor/iso-kit.mjs';
import { P, scene, BASE } from './map-geometry.mjs';
import { mapExample, mapPose } from '../src/anatomy/map-model.ts';

const audit = process.argv.includes('--audit');
const art = scene(mapExample, audit);
const order = new Map(art.R.items.map((item, i) => [item.name, i]));
if (audit)
  for (const values of [
    { systolic: 1, diastolic: 1 },
    { systolic: 240, diastolic: 1 },
    { systolic: 120, diastolic: 120 },
    { systolic: 240, diastolic: 240 },
    { systolic: 400, diastolic: 200 },
    { systolic: 150, diastolic: 80 },
    { systolic: 120, diastolic: 110 },
  ]) {
    console.log('MAP pose', values);
    scene(values, true, order);
  }
const origin = iso([0, 0, 0], P);
const vector = (v) => iso(v, P).map((value, i) => value - origin[i]);
writeFileSync(
  new URL('../src/anatomy/map-art.json', import.meta.url),
  JSON.stringify({
    width: 680,
    height: 410,
    origin,
    xVector: vector([1, 0, 0]),
    yVector: vector([0, 1, 0]),
    zVector: vector([0, 0, 1]),
    halo: `<path class="iso-halo" d="${haloOf(BASE, -18, 10, P)}"/>`,
    initialHeights: mapPose(mapExample).heights,
    parts: art.R.items.map((item) => ({ name: item.name, group: item.group, svg: item.svg })),
  }),
);
console.log(`Generated unique MAP instrument: ${art.partCount} parts`);
