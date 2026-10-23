# FIB-4 · shaped-cam comparator

Figure tier: one open four-track cam measuring bench; target 60–75 real solids.

## Concept (before geometry)

Four guided feelers run along shaped cams. The first three tracks are linear input witnesses (age, AST, platelets); the fourth has the analytic √ALT profile. Two comparison registers at the right use the **same scale** for age × AST and platelets × √ALT. A separate narrow index displays their quotient on an explicitly disclosed expanding scale. A taller denominator register reduces the quotient; the cam makes the square-root reduction visible. This is a computationally coupled teaching instrument, not a claim that four independent cams physically multiply without hidden gearing.

All values come from `evaluateCalculator` and the registry's `calculate`. No clinical cutoffs, normal ranges, classifications or treatment advice are introduced. Track ranges are drawing ranges only, expanded upward as needed. Readouts and model are exact; tiny positive dimensions can be subpixel. The registry currently has four numeric parameters and no selectable units or categories; the public component still forwards units and unit callbacks.

## Parts list, grouped before drawing

- Base: four elastomer pads, four feet, sole, beveled deck, screwed identification plaque (11).
- Four cam cassettes: mounting plinth, near end clamp, far end clamp, shaped solid cam, edge scale strip (20; total 31).
- Four feeler assemblies: side contact ball, spindle, horizontal sleeve, knurled crown (16; total 47).
- Four front controls: lower bearing, knurled thumbwheel, top dial (12; total 59).
- Comparator: two register rails, two end stops, two variable register bars, shared scale strip (7; total 66).
- Quotient: index rail, variable tongue, end stop, scale strip (4; total 70).

Fasteners are rooted rings with central witness dots; scale ticks terminate on the scale perimeter. Cam cross sections, bevels, knurling and the nonlinear ALT edge remain visible at 4×. Painter's order is solved from the same recorded geometry used to draw the solids, including moving feelers and the expanding bars. Audit samples cover independent inputs, boundaries, expanded scales and intermediate transitions.

## Interaction and motion

Four visible corner thumbwheels have separate 44 CSS-pixel targets. Drag vertically; arrows use registry steps, Shift is not required. Home/End use the declared drawing range within registry limits. `useTouchLock(svgRef, '.fib4-handle')` cancels real touches only on those controls; the remaining SVG scrolls normally. NumericInput uses shared raw display values and units and idPrefix anatomy. Blank/invalid input immediately hides all moving geometry and clears the SVG data readout. Input changes ease over 140 ms, recomputing the true formula throughout; no idle input autoplay. Reduced motion snaps, hidden documents and offscreen figures suspend animation. All handlers detach on unmount.

## Geometry/readout contract

A track has ordinate 5 + 32 × v/domain (three linear tracks); ALT uses 5 + 32 × √(ALT/domain). Each feeler translates along the visible side face one unit below the analytic ordinate, avoiding a singular vertical contact at ALT approaching zero. The dual bars have lengths N × s and D × s, with s = min(0.02, 76/max(N,D)); hence their ratio is always the exact FIB-4. Quotient tongue length is 76 × result/max(4,result), with its current upper scale shown outside the drawing. Drawing domains never constrain the numeric form or change the clinical calculation.

## Integration and reproduction

Export: `Fib4Anatomy` from `./anatomy/Fib4Anatomy`, with `Fib4AnatomyProps` (`raw`, `units`, `onChange`, `onUnitChange`, `onPreset`). Lazy-load for calculator id `fib4`, replace its generic Anatomy branch, and forward the main form callbacks. `onPreset` supplies canonical display strings; the parent resets `units` to `{}`. The existing registry currently has no unit switch or categorical option for FIB-4; none are added here.

Parent-owned follow-up: set the registry custom-figure flag if needed, add `src/anatomy/fib4-art.json` to `.prettierignore`, and add the desired package scripts/README entry. No shared integration, registry, package or existing figure file is part of this commit. The generated art is intentionally compact JSON. Numeric source and verification JSON use Prettier.

Generation: `node scripts/build-fib4-anatomy.mjs`.
Audit: `node scripts/build-fib4-anatomy.mjs --audit` (70 true solids, 14 sampled poses, all audit categories zero). Both commands rebuild the vendored-kit geometry and solve a common painter order across the sampled poses. npm wrappers may be registered as `anatomy:fib4` and `anatomy:fib4:audit` by the parent; they are not added in this feature commit.

Browser QA after integration, with the assigned server `npm run dev -- --port 5205 --strictPort`:

```sh
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs \
  http://localhost:5205/#/rechner/fib4 --actions scripts/verify-fib4-anatomy.json
```

Repeat with `--width 390 --height 844`, and separately with `--reduced`. Screenshot paths in the actions file are fixed; copy or rename the actions' output paths to preserve independent runs. Local final phone and reduced-motion runs used `/tmp/fib4-verify-mobile.json` and `/tmp/fib4-verify-reduced.json`, identical actions with `fib4-mobile-` / `fib4-reduced-` screenshot prefixes.

Verified: all four isolated parameter effects; exact registry result and register ratio; shared main/lower inputs in both directions; four keyboard and pointer controls; four nonoverlapping 44px targets; real native non-passive TouchEvent prevention on controls and no prevention on the rest of the SVG, including touchcancel reset; invalid and blank clearing; expanded drawing scales; offscreen animation suspension/resume; reduced-motion run; desktop and 390px layouts; 4× light/dark close-ups, hover and a five-frame slowed transition. Each run ended `console: clean`; every resting-pose line check ended `line ends: 0 of 476 ends on 159 lines float`. No physical iOS device test was run. No exploded pose exists for this fixed bench; audit apart/mid-flight categories therefore reduce to the sampled operational poses.

Validation: `npm test -- --reporter=dot` passed 12 files / 180 tests. `npm run build` passed with temporary feature wiring (Vite's chunk-size advisory only). Scoped Prettier checks passed. T3 preview navigation succeeded, but two snapshot attempts timed out; the explicitly authorized Anatomy drive scripts supplied the browser evidence.

Screenshots remain local under `docs/anatomy-map/shots/` (ignored by Git): `fib4-anatomy-desktop.png`, `fib4-mobile-anatomy-phone.png`, `fib4-anatomy-close.png`, `fib4-anatomy-dark-close.png`, `fib4-anatomy-hover.png`, `fib4-anatomy-motion.png`, plus separate mobile/reduced variants and rooted-line images.
