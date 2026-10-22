import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import * as k from './vendor/iso-kit.mjs';
import * as G from './vendor/lathe.mjs';
import * as A from './vendor/audit.mjs';

const HERE = new URL('.', import.meta.url);
const { calculators } = await import('../../src/calculators.ts');
const calculator = calculators.find((entry) => entry.id === 'map');
assert(calculator);
const calculate = calculator.calculate;
const initial = { systolic: 120, diastolic: 80 };
const zAt = (pressure) => 14 + 0.68 * pressure;
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
      ticks += L(k.segment([x - 8, -4, zAt(p)], [x - 8 + len, -4, zAt(p)], P), {
        tone: p % 20 === 0 ? 'mid' : 'lo',
      });
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

const art = scene(initial, process.argv.includes('--audit'));
console.log(`${art.partCount} physical parts`);
if (process.argv.includes('--audit')) {
  for (const values of [
    { systolic: 60, diastolic: 30 },
    { systolic: 220, diastolic: 140 },
    { systolic: 220, diastolic: 30 },
    { systolic: 120, diastolic: 120 },
  ]) {
    console.log('Checking pose', values);
    scene(values, true, new Map(art.R.items.map((item, index) => [item.name, index])));
  }
}

const kitCode = readFileSync(new URL('./vendor/iso-kit.mjs', HERE), 'utf8').replace(
  /^export /gm,
  '',
);
const latheCode = readFileSync(new URL('./vendor/lathe.mjs', HERE), 'utf8')
  .replace(/^import .*;\n/gm, '')
  .replace(/^export /gm, '');
const runtime = `
${kitCode}
const LATHE = (() => { ${latheCode}; return { prismOf }; })();
const projection = ${JSON.stringify(P)};
const mapCalculation = ${calculate.toString()};
const zPressure = ${zAt.toString()};
const framePlane = ${JSON.stringify(FF)};
const root = document.querySelector('main');
const stage = document.querySelector('.iso-stage');
const stageSvg = stage.querySelector('svg');
const readout = document.querySelector('[data-readout]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const controls = { systolic: document.querySelector('#systolic'), diastolic: document.querySelector('#diastolic') };
const outputs = Object.fromEntries(['systolic','diastolic','map','pulse','gain','equation'].map(n => [n,document.querySelector('[data-value="'+n+'"]')]));
const sliderItems = [0,1,2].map(i => [...document.querySelectorAll('[data-group="slider'+i+'"]')]);
const beamItems = [...document.querySelectorAll('[data-group="beam"]')];
const tourButton = document.querySelector('#tour');
let target = {systolic:120,diastolic:80}, current = {...target};
let touring = false, visible = false, frame = 0, last = 0, tourTime = 0, drag = null;
const stops = [[120,80],[150,80],[120,80],[120,110],[90,60],[180,60]];
const clampValue = (x,a,b) => Math.min(b,Math.max(a,x));
function setTour(value) { touring = value && !reduced.matches; tourButton.setAttribute('aria-pressed',String(touring)); tourButton.textContent = reduced.matches ? 'Next example' : touring ? 'Pause tour' : 'Play tour'; if(touring) tourTime=0; run(); }
function setInput(name,value) {
  setTour(false);
  if(name==='systolic') target.systolic = clampValue(Math.round(value),Math.max(60,target.diastolic),220);
  else target.diastolic = clampValue(Math.round(value),30,Math.min(140,target.systolic));
  syncControls(); run();
}
function syncControls() {
  controls.systolic.value=String(target.systolic); controls.diastolic.value=String(target.diastolic);
  controls.systolic.min=String(Math.max(60,target.diastolic)); controls.diastolic.max=String(Math.min(140,target.systolic));
  controls.systolic.setAttribute('aria-valuetext',target.systolic+' mmHg'); controls.diastolic.setAttribute('aria-valuetext',target.diastolic+' mmHg');
}
function draw() {
  const {systolic:s,diastolic:d}=current, m=mapCalculation(current);
  [d,m,s].forEach((pressure,i) => {
    const delta = zPressure(pressure)-zPressure([80,mapCalculation({systolic:120,diastolic:80}),120][i]);
    const transform=translateAlong(projection,[0,0,delta]); sliderItems[i].forEach(el=>el.setAttribute('transform',transform));
  });
  const along=x=>zPressure(d)+(x+120)/240*(zPressure(s)-zPressure(d));
  [[-120,-40],[-40,120]].forEach(([from,to],i)=>{
    const polygon=[[from,along(from)],[to,along(to)],[to,along(to)+5],[from,along(from)+5]];
    let svg=solidSvg(LATHE.prismOf(framePlane,polygon,0,4,projection),{tone:'hi'});
    const ticks=[]; for(let x=from+4;x<to;x+=4) ticks.push(lineSvg(segment([x,14,along(x)],[x,14,along(x)+(x%20===0?2.2:1.2)],projection),{tone:'lo'}));
    beamItems[i].innerHTML=svg+ticks.join('');
  });
  outputs.systolic.textContent=s.toFixed(0); outputs.diastolic.textContent=d.toFixed(0); outputs.map.textContent=m.toFixed(1);
  outputs.pulse.textContent=(s-d).toFixed(0); outputs.gain.textContent=((s-d)/3).toFixed(1);
  outputs.equation.textContent=d.toFixed(0)+' + ('+s.toFixed(0)+' − '+d.toFixed(0)+') / 3 = '+m.toFixed(1);
  readout.textContent='MAP '+m.toFixed(1)+' mmHg';
  root.dataset.systolic=s.toFixed(3);root.dataset.diastolic=d.toFixed(3);root.dataset.map=m.toFixed(6);
  stageSvg.setAttribute('aria-label','Interpolating instrument: diastolic '+d.toFixed(0)+', systolic '+s.toFixed(0)+', estimated MAP '+m.toFixed(1)+' millimeters of mercury. The bright shoe is one third of the horizontal distance from the diastolic end.');
}
function tick(now) {
  frame=0;
  if(!visible || document.hidden) {last=0;return;}
  const dt=last?Math.min((now-last)/1000,0.05):1/60;last=now;
  if(touring){ tourTime+=dt;const stop=stops[Math.floor(tourTime/3)%stops.length]; target={systolic:stop[0],diastolic:stop[1]};syncControls(); }
  let moving=false;
  for(const key of ['systolic','diastolic']){current[key]=reduced.matches?target[key]:current[key]+(target[key]-current[key])*(1-Math.exp(-dt/0.22));if(Math.abs(current[key]-target[key])<0.005)current[key]=target[key];else moving=true;}
  draw();if(touring||moving)run();
}
function run(){if(visible&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible){last=0;run();}else if(frame){cancelAnimationFrame(frame);frame=0;last=0;}}).observe(stage);
document.addEventListener('visibilitychange',()=>{last=0;run();});
reduced.addEventListener('change',()=>{if(reduced.matches)setTour(false);run();});
for(const [name,input]of Object.entries(controls))input.addEventListener('input',()=>setInput(name,Number(input.value)));
tourButton.addEventListener('click',()=>{if(reduced.matches){const stop=stops[(stops.findIndex(s=>s[0]===target.systolic&&s[1]===target.diastolic)+1)%stops.length];target={systolic:stop[0],diastolic:stop[1]};syncControls();run();}else setTour(!touring);});
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{setTour(false);const [s,d]=button.dataset.preset.split(',').map(Number);target={systolic:s,diastolic:d};syncControls();run();}));
stage.addEventListener('pointerdown',event=>{
 const box=stageSvg.getBoundingClientRect(), px=(event.clientX-box.left)*680/box.width, py=(event.clientY-box.top)*410/box.height;
 const choices=[['diastolic',-120],['systolic',120]].map(([name,x])=>({name,p:iso([x,16,zPressure(current[name])+2.5],projection)}));
 const chosen=choices.sort((a,b)=>Math.hypot(a.p[0]-px,a.p[1]-py)-Math.hypot(b.p[0]-px,b.p[1]-py))[0];
 if(Math.hypot(chosen.p[0]-px,chosen.p[1]-py)>35)return;
 event.preventDefault();setTour(false);drag={name:chosen.name,y:event.clientY,value:target[chosen.name],ratio:410/box.height};stage.setPointerCapture(event.pointerId);stage.classList.add('dragging');
});
stage.addEventListener('pointermove',event=>{if(!drag)return;const v=axisVector(projection,[0,0,1]);setInput(drag.name,drag.value+(event.clientY-drag.y)*drag.ratio/v[1]/0.68);});
const release=()=>{drag=null;stage.classList.remove('dragging');};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
document.querySelector('#theme').addEventListener('click',()=>{const light=document.body.dataset.theme!=='light';document.body.dataset.theme=light?'light':'dark';document.querySelector('#theme').textContent=light?'Dark paper':'Light paper';});
document.querySelector('#theme').textContent=document.body.dataset.theme==='light'?'Dark paper':'Light paper';
syncControls();draw();setTour(false);
// Tour once the reader has had time to read the initial values; manual interaction cancels this.
let touched=false;document.addEventListener('pointerdown',()=>{touched=true;},{once:true});document.addEventListener('keydown',()=>{touched=true;},{once:true});
setTimeout(()=>{if(!touched&&!reduced.matches)setTour(true);},9000);
`;

const extraCss = `
.iso[data-theme=dark]{--anatomy-mid:#8b8b8b;--anatomy-lo:#595959;--anatomy-faint:#333;--anatomy-muted:#a0a0a0;--anatomy-top:#303030;--anatomy-shade-0:#151515;--anatomy-shade-1:#1b1b1b;--anatomy-shade-2:#232323;--anatomy-shade-3:#292929;--anatomy-lit-top:#8c8c8c;--anatomy-lit-shade:#5e5e5e}
html,body{margin:0;background:transparent;color:var(--foreground,var(--anatomy-text));font-family:var(--font-sans,Inter,Arial,sans-serif)}
body{padding:0!important;max-width:none!important}.wrap{max-width:900px;margin:0 auto;padding:0}
.intro{padding:10px 0 18px}.eyebrow{font:10px var(--anatomy-mono);letter-spacing:.13em;text-transform:uppercase;color:var(--anatomy-muted)}
h1{font-weight:520;letter-spacing:-.035em;font-size:30px;line-height:1.12;margin:10px 0}p{font-size:14px;line-height:1.6;margin:0;color:var(--anatomy-muted)}
.intro p{max-width:570px}.iso-plate{border:none;box-shadow:none;border-radius:var(--radius,12px);padding:46px 16px 43px;background:var(--anatomy-card)}
.iso-svg{width:100%;height:auto;display:block;max-height:420px}.iso-stage{touch-action:pan-x;cursor:grab}.iso-stage.dragging{cursor:grabbing}
.iso-plate-corners{inset:20px}.iso-plate-corner{font-size:10px}.iso-plate-corner[data-corner=hint]{text-transform:none;letter-spacing:0}
.bank{display:grid;grid-template-columns:1fr 1fr 1fr;margin:0 4px;padding:12px 0 4px;border-top:1px solid var(--anatomy-faint);gap:6px}
.bank>div{text-align:center}.bank span{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--anatomy-muted)}
.bank strong{display:block;font:26px var(--anatomy-mono);letter-spacing:-.07em;margin:5px 0;color:var(--anatomy-hi)}.bank .answer strong{color:var(--anatomy-lit)}.bank small{font-size:10px;color:var(--anatomy-muted)}
.legend{font-size:12px;color:var(--anatomy-muted);padding:12px 0}.legend b{color:var(--anatomy-lit);font-weight:500}
.controls{display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:12px 0 18px}.control label{font-size:12px;display:block;margin-bottom:10px;color:var(--anatomy-text)}
input[type=range]{width:100%;margin:0;accent-color:var(--anatomy-text);cursor:pointer}button{font:11px var(--anatomy-mono);color:var(--anatomy-text);background:transparent;border:1px solid var(--anatomy-lo);border-radius:6px;padding:8px 11px;cursor:pointer}button:hover{background:var(--anatomy-faint)}button:focus-visible,input:focus-visible{outline:2px solid var(--anatomy-lit);outline-offset:4px}button[aria-pressed=true]{background:var(--anatomy-faint)}
.actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:22px}.actions .spacer{flex:1}
.math{border-top:1px solid var(--anatomy-faint);padding:20px 0 12px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
.math code{font:17px var(--anatomy-mono);color:var(--anatomy-text)}.math .unit{font-size:10px;color:var(--anatomy-muted)}
.why{display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:12px 0 18px}.why h2{font-size:14px;font-weight:550;letter-spacing:-.02em;margin:0 0 7px}.why p{font-size:12px}
.source{font:10px var(--anatomy-mono);line-height:1.7;color:var(--anatomy-muted);border-top:1px solid var(--anatomy-faint);padding:12px 0}.source a{color:inherit;text-underline-offset:3px}.source code{font:inherit}
@media(max-width:480px){h1{font-size:27px}.iso-plate{padding:46px 16px 58px}.iso-plate-corner[data-corner=hint]{bottom:20px}.bank strong{font-size:23px}.controls{gap:18px}.why{grid-template-columns:1fr;gap:15px}.math{grid-template-columns:1fr}.math code{font-size:14px}.actions .spacer{display:none}.iso-svg{min-height:260px}.bank span{font-size:9px}.intro p{font-size:13px}}
`;

const svg = k.figureSvg({
  width: 680,
  height: 410,
  label:
    'A precision interpolating bench. The bright output shoe lies one third of the horizontal span between the diastolic and systolic sliders.',
  body: [`<path class="iso-halo" d="${k.haloOf(BASE, -18, 10, P)}"/>`, art.body],
});
const body = `<main class="wrap"><div class="intro"><span class="eyebrow">Anatomy of a calculation · Cardiology</span><h1>Why the mean sits closer<br>to the lower pressure.</h1><p>Mean arterial pressure (MAP, or MAD in this repo) gives diastolic pressure twice the weight of systolic pressure. This measuring bench makes the weighting visible.</p></div>
<figure style="margin:0"><div class="iso-plate"><div class="iso-plate-corners"><span class="iso-plate-corner" data-corner="fig">Fig 01</span><span class="iso-plate-corner" data-corner="title">The one-third straightedge</span><span class="iso-plate-corner" data-corner="hint">Drag an end or use the sliders below</span><span class="iso-plate-corner" data-corner="readout" data-readout>MAP 93.3 mmHg</span></div><div class="iso-stage">${svg}</div><div class="bank"><div><span>Left · Diastolic</span><strong data-value="diastolic">80</strong><small>mmHg · input</small></div><div class="answer"><span>Bright shoe · MAP</span><strong data-value="map">93.3</strong><small>mmHg · estimate</small></div><div><span>Right · Systolic</span><strong data-value="systolic">120</strong><small>mmHg · input</small></div></div></div>
<figcaption class="legend">The <b>bright shoe</b> stays at ⅓ of the horizontal span from the left end. Its height is the estimated MAP. The straightedge is a mathematical analogy.</figcaption></figure>
<div class="controls"><div class="control"><label for="diastolic">Diastolic pressure · left end</label><input id="diastolic" type="range" min="30" max="120" step="1" value="80"></div><div class="control"><label for="systolic">Systolic pressure · right end</label><input id="systolic" type="range" min="80" max="220" step="1" value="120"></div></div>
<div class="actions"><button data-preset="150,80">Systolic +30</button><button data-preset="120,110">Diastolic +30</button><button data-preset="120,80">Reset 120/80</button><span class="spacer"></span><button id="tour" aria-pressed="false">Play tour</button><button id="theme">Light paper</button></div>
<div class="math"><div><span class="eyebrow">MAP ≈ D + ⅓ × (S − D)</span><div style="margin-top:8px"><code data-value="equation">80 + (120 − 80) / 3 = 93.3</code> <span class="unit">mmHg</span></div></div><p style="font-size:12px">Pulse pressure: <span data-value="pulse">40</span> mmHg<br>One third adds <span data-value="gain">13.3</span> mmHg</p></div>
<div class="why"><div><h2>Try moving each end by 30.</h2><p>From 120/80, raising systolic pressure by 30 raises MAP by 10. Raising diastolic pressure by 30 raises MAP by 20. The output sits closer to the diastolic end, so it follows that end more strongly.</p></div><div><h2>Why that weighting?</h2><p>MAP is the time average over a heartbeat. At usual heart rates, more time is spent in diastole. This formula approximates the waveform; heart rate, rhythm and pulse shape can change its accuracy.</p></div></div>
<footer class="source">Uses the actual <code>map.calculate</code> from <code>src/calculators.ts</code> · <a href="https://www.ncbi.nlm.nih.gov/books/NBK538226/" target="_blank" rel="noreferrer">StatPearls</a> · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11409525/" target="_blank" rel="noreferrer">AHA scientific statement</a></footer></main>`;
for (const theme of ['dark', 'light']) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Anatomy · Mean arterial pressure</title><style>${k.ISO_CSS}\n${extraCss}</style></head><body class="iso" data-theme="${theme}">${body}<script type="module">${runtime.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
  const path = new URL(theme === 'light' ? 'index-light.html' : 'index.html', HERE);
  writeFileSync(path, html);
  console.log('Wrote', fileURLToPath(path));
}
