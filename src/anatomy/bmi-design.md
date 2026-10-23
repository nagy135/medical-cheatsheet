# BMI · Die Lastflächenpresse

Figure tier: a four-column load-spreading press, 54 real solids. The square platen's
side follows height; its square area follows height². The lit specimen has volume
proportional to mass and thickness proportional to mass/height². This is a
geometric division model, not pressure, body cross-section, body surface area or
a biological simulation. No added clinical thresholds. Registry owns formula,
limits, interpretation and note. Both original inputs use shared form state.
BMI has no categorical options or unit switches in the current registry; the
public interface still accepts and forwards units through canonical evaluation.

Parts list before geometry:

- Base: four rubber pads, four feet, sole, screwed plinth (10).
- Four column assemblies: square pedestal, flange, lower bearing, column,
  upper bearing (20).
- Header: back/front crossheads and left/right side ties (4).
- Bed: bottom seat, screwed square bolster, ruled bearing face (3).
- Live subject: square platen, lit load specimen, follower cap (3).
- Controls: two screwed housings, lids, spindle collars, knurled wheels,
  inset dial faces (10).
- Finish: service hatch and three closed vent ribs (4).

World: base x−110..110, y−110..160; feet−16..−8; sole−8..−6;
plinth−6..0. Bed0..14, variable platen14..18. Load18..18+t;
follower18+t..20+t. Columns at (±82,±82), end106; header106..112.
Controls (−65,132),(65,132) sit on the front apron. Parts meet at faces.

Linear scale: 0.5 world units per cm for both square edges. Vertical scale:
min(1.35,70/BMI) world units per BMI unit, explicitly expanded at extremes.
Thus area = side²; load volume / (2500 × verticalScale) = mass kg.
The model never floors a tiny load or clamps a result. The variable shape is
rebuilt from the identical pure solid helper in build and runtime. All sampled
poses contribute to a single measured painter order, including interpolated
paths, both bounds and a near-zero load. Real geometry is recorded for audit.

One time-based exponential loop updates refs and the live figure readout from
one intermediate canonical model. No automatic input changes. Stop settled,
offscreen and hidden; jump under reduced motion. Two separate 44px minimum
handles, native non-passive selective touch lock, capture/cancel/lost-capture,
arrows (Shift ×10), Home/End. NumericInput uses idPrefix anatomy.

Verify formula, individual sensitivities, square law, equal-BMI cases, extreme
scale identity, units behavior, invalid clearing. Audit to zero; rooted lines
in both themes, desktop/390px/4×, keyboard/pointer/touch and reduced/offscreen.

## Integration and evidence

Export `BmiAnatomy` from `./anatomy/BmiAnatomy`, with `BmiAnatomyProps`:
`raw`, `units`, `onChange(field,value)`, `onUnitChange(field,index)` and
`onPreset(values)`. Pass the main form's display strings and unit indices. Parent
must reset units when applying canonical presets. Lazily import it for `bmi` in
App; no shared integration edits are included in this feature commit.

Generation: `node scripts/build-bmi-anatomy.mjs`.
Audit: `node scripts/build-bmi-anatomy.mjs --audit`.
Suggested parent npm script names: `anatomy:bmi` and `anatomy:bmi:audit`, mapped
to those commands. Add `src/anatomy/bmi-art.json` to the parent's Prettier ignore
alongside the other generated art. No new dependency is needed.

Audit on 2026-10-23: 54 solids, 31 sampled poses, every audit metric zero;
all 31 poses ended `audit passed`. Includes endpoints, near-zero weight and
24 interpolated input poses. `npm test`: 183 tests passed across 12 files,
including 16 BMI tests. `npm run build` passed with temporary BMI integration;
source also typechecked after restoring App. Generated JSON is intentionally
compact. Scoped source formatting passed.

Browser QA used port 5201 with `--strictPort`. T3 preview opened successfully,
but two snapshots failed with `Preview automation snapshot timed out after
15000ms.`; authorized Anatomy scripts provided the QA instead. With BMI wired:

```sh
npm run dev -- --port 5201 --strictPort
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs 'http://localhost:5201/#/rechner/bmi' --actions scripts/verify-bmi-anatomy.json --height 1000
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs 'http://localhost:5201/#/rechner/bmi' --actions scripts/verify-bmi-anatomy.json --height 1000 --width 390
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs 'http://localhost:5201/#/rechner/bmi' --actions scripts/verify-bmi-anatomy.json --height 1000 --reduced
```

The reusable drive sequence checks independent parameter effects, formula,
main ↔ Anatomy synchronization, pointer drag, keyboard steps, invalid/reset,
44px separate targets, overflow, native cancelable touch events, offscreen sleep
and resume. Line checks: `0 of 200 ends on 106 lines float`, including each
preset, expanded vertical scale, and light/dark themes. All successful runs
ended `console: clean`.

Additional real CDP touch sequences (temporary extended copy of Anatomy drive,
`/tmp/bmi-touch-drive.mjs`, actions `/tmp/bmi-touch-actions.json`) verified input
change without page scrolling, `touchCancel`, and non-control SVG page scrolling
after cancellation. Browser is mobile-emulated Chrome; physical iOS was not
available. No touch hook edits were made. Additional two-RAF probes confirmed
normal easing through intermediate model values and immediate reduced-motion
settlement. A six-frame 0.05× motion sheet showed smooth growth.

Inspected screenshots on this machine:
`/tmp/bmi-desktop-desktop.png`, `/tmp/bmi-mobile-desktop.png`,
`/tmp/bmi-desktop-close-light.png`, `/tmp/bmi-desktop-close-dark.png`,
`/tmp/bmi-desktop-lines-light.png`, `/tmp/bmi-desktop-lines-dark.png`,
`/tmp/bmi-touch-mobile.png`, `/tmp/bmi-motion-sheet.png`.
Logs: `/tmp/bmi-audit.log`, `/tmp/bmi-browser-desktop.log`,
`/tmp/bmi-browser-mobile.log`, `/tmp/bmi-browser-reduced.log`,
`/tmp/bmi-touch.log`, `/tmp/bmi-motion.log`, `/tmp/bmi-still.log`.

No shader, explode mode or autoplay is needed for this mechanism. Clinical text
and thresholds remain owned by the registry. At the minimum allowed positive
weight the true load thickness is subpixel; it is not enlarged artificially.
