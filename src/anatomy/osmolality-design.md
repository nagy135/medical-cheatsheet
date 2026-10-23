# Die additive Dosierbank

Figure tier: 40–80 real solids. Concept and parts were specified before geometry.
Four tapered, open-front ingredient hoppers stand over a collection tray: the first
two are a mechanically paired sodium dose, then glucose and urea. Their visible
contents encode the same mmol/l-equivalent contributions. The receiver adds the
four doses into three contiguous calibrated inserts (2 Na, glucose, urea).
It is a cutaway explanatory dosing instrument, not a laboratory measurement or
a fluid-flow simulation. No balance beam, cabinet, carousel or plotter is used.

Truth: the original osmolalitaet registry owns all conversions, validation and the
result. Canonical glucose is mg/dl, sodium and urea mmol/l. Hopper doses are
Na, Na, glucose/18.0182 and urea. Shared display units remain parent-owned.
The receiver lengths use one common scale, min(0.75,252/result), preserving
ratios even for very large accepted inputs. Hopper fill is also truthful: its
cross-sectional area is 10*h + (14/64)*h²; invert that quadratic to make its
volume proportional to the dose, on one shared auto-expanding scale. No fake
minimum fill. Empty/invalid fields hide every variable solid and live result.

Parts list before geometry (planned 70 solids):

- Base: four rubber pads, four feet, sole and bevelled plinth (10).
- Gantry: two post shoes, two rear uprights, two post caps and support beam (7).
- Four hoppers: back sheet, left tapered sheet, right tapered sheet, throat floor,
  gate body, outlet nozzle and top back lip (28); four variable ingredient fills.
- Receiver: collection floor, left/right rims, low front rim, ruler, three dose
  inserts and a sodium split seam (8 solids; seam is rooted markup).
- Three controls: mounting pedestal, spindle, knurled wheel and inset dial (12).
- A single engraved identification plate (1). Screws and seams belong to faces.

World: wide bench x−150..150, y−38..93. Hopper fronts are cut away at y10,
backs y−20, throat z46, crown z110; x centres −104,−54,23,96. The paired
sodium cartridges share a wide control wheel station. Hoppers touch a rear
support beam at z42..46. Receiver floor z0..6, y14..44.5; contents z6..20,
front rim z6..10, ruler z10..12. Three knobs at x−95,10,110,y74.
Camera elevated to show the open contents and collector; measured union painter
order across extremes and interpolation samples. True prism shapes recorded
for every tapered panel and fill; kit discs for turned nozzles/controls.

Motion: refs update geometry and its exact instantaneous readout together using
exponential follow. No autoplay of clinical inputs. IntersectionObserver and
visibility suspend frames; reduced motion settles immediately. Pointer drags and
keyboard arrows use the selected display unit's registry step. Native nonpassive
useTouchLock(svgRef,'.osmolality-handle') cancels control touches only; blank
areas retain page scrolling. Handles have independent ≥44px hit targets.

Final implementation: 75 solids. The planned 70 gained four welded rear
stiffening ribs and one physical link between the sodium gates. No audit
allow/cover/crowd exceptions. Only the seven volume inserts change shape.

Validation: `npm test` passes 179 tests (12 dedicated osmolality tests), and
`npm run build` passes. `node scripts/build-osmolality-anatomy.mjs --audit`
reports `audit passed` for all 13 sampled poses, every failing line at zero:
ordinary inputs, independent changes, all-minimum inputs, each dominant large
input, and interpolation samples. Ref output uses the same eased model, with
an approximate sign because displayed contributions and result are rounded.

Browser checks use the named Anatomy drive script against temporary App wiring
at `http://localhost:5203/#/rechner/osmolalitaet`; start Vite with
`npm run dev -- --port 5203 --strictPort`. The script contract is
`scripts/verify-osmolality-anatomy.json`. Use a 1440×900 desktop viewport or
390×1000 phone viewport; 1300px desktop height cannot move this entire figure
offscreen anywhere on the current page. The reduced-motion run uses `--reduced`.
The ordinary desktop, phone, light/dark 4×, hover, six-frame eased-motion and
reduced-motion captures were read visually. Rooted-line checks report zero
(254 checked ends on 116 lines) across presets, limiting poses and motion.
Numeric/units, keyboard, pointer capture, ≥44px targets, nonoverlap, native
cancelable touch locking, scrolling on body touches, reset/example, invalid
geometry clearing, offscreen suspension and resume are exercised. No idle tour
changes clinical inputs. No WebGL or explode mode is needed for this mechanism.

Integration: export `OsmolalityAnatomy` from `OsmolalityAnatomy.tsx`; props are
`raw`, `units`, `onChange`, `onUnitChange`, `onPreset`. Use the same parent raw
and units state and unit-conversion handler as the main form. Presets supply
canonical display strings, so the parent must reset units. Add the custom route
for calculator id `osmolalitaet`, preferably a lazy import. Parent owns registry
flag, App wiring, package aliases and generated-JSON Prettier ignore. Generation:
`node scripts/build-osmolality-anatomy.mjs`; auditing appends `--audit`.
No clinical thresholds, interpretation, sources or registry formulas were changed.
Temporary shared App wiring is removed before the feature commit.

QA files are outside the feature commit in `/tmp/osmolality-shots/`; logs are
`/tmp/osmolality-audit-final.log`, `/tmp/osmolality-browser-desktop.log`,
`/tmp/osmolality-browser-phone-final.log` and `/tmp/osmolality-reduced-full.log`.
The browser actions write the same desktop names by default; duplicate the JSON
with a phone output prefix when retaining both capture sets. T3 preview was tried
first; two snapshot calls timed out, so the authorized Anatomy scripts were used.
