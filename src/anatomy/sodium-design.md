# Sodium · Katz correction ramp

Figure tier: a screw-driven inclined measuring ramp, 40–80 real solids.

## Concept before geometry

Measured sodium raises the datum pedestal. Glucose excess above 100 mg/dl advances a follower up a calibrated ramp; its vertical rise is exactly 1.6 × excess / 100 mmol/l. A lit witness on the follower shows the sum of datum height and correction. This is an inclined-plane height comparator, with an exposed lead screw parallel to the ramp, rather than another compound slide rule.

The original `natrium` calculator owns evaluation, glucose conversion (18.0182), minimum glucose, and clinical note. Inputs are shared display-unit strings. All geometry uses canonical evaluated values. Empty or invalid forms hide every variable part and result. No autoplay changes clinical inputs.

## Parts list before geometry

Base and controls (25): four rubber pads, four leveling feet, sole plate, cast bed, four corner bolts, datum mount, sodium thumbwheel housing/cover/collar/wheel/dial, engraved Katz plate, two calibration stop mounts and their two caps.

Datum assembly (14): four knurled sleeves and four exposed column extensions, raised cap, front reference edge, two end cheeks and their two fasteners.

Inclined plane and drive (17): solid wedge, two wear strips, correction ruler, two bearing feet, two tangent bearing pads, four bearing halves, two exposed shaft sections, drive hub, handwheel and handwheel face.

Follower (8): inclined contact shoe, split screw nut, nut saddle, connecting lug, lit witness bracket and bead, two shoe fasteners.

Final figure: **64 real solids**, with each half-bearing recorded as its true concave annular prism. The two exposed shaft sections meet the nut's internal engagement faces. Thread strokes follow actual helical surface curves, end at the shaft silhouette/caps, and rotate with the wheel's face mark. Knurls fade with surface facing; other scale strokes and slots root to solid edges.

## Geometry and motion contract

Use one common vertical scale for sodium, correction and sum; horizontal travel is glucose excess on an explicitly reported adaptive range. Wedge slope is derived from these two scales. No clipping of clinical values and no added validity thresholds. The follower's bottom matches the ramp's slope; bearings and screw share the same inclined frame. Exact shape descriptors feed the vendored audit. Solved painter order is verified across the operating poses and interpolation samples.

Exponential easing uses one RAF loop with DOM writes. It sleeps when settled, outside the viewport or document hidden; reduced motion snaps to the target. Pointer capture, cancellation and loss release drags; arrow/Shift keys and Home operate the same values. Native `useTouchLock(svgRef, '.sodium-handle')` cancels real handle touch scrolling while the rest of the SVG remains scrollable. Handle targets remain at least 44 CSS px at 390px width.

## QA

Generation/audit: `node scripts/build-sodium-anatomy.mjs --audit`. Browser plan: `scripts/verify-sodium-anatomy.json`, desktop, 390px, light/dark, zero and raised correction, units, invalid/blank, pointer/keyboard, native touch cancellation, reduced/offscreen behavior, rooted lines, 4× mechanism close-ups. No exploded pose: disassembly does not explain this arithmetic.

## Integration handoff

Export: `SodiumAnatomy` and `SodiumAnatomyProps` from `SodiumAnatomy.tsx`. Props are exactly `raw`, `units`, `onChange`, `onUnitChange`, `onPreset`; the parent keeps ownership of all form state. Route calculator id `natrium` to this component in App using the existing lazy/Suspense pattern. Pass `onUnitChange` through the parent's `changeUnit` helper; reset units when applying a preset. The component imports its own CSS and shared Anatomy styles.

Suggested package scripts, left for the parent as requested:

- `anatomy:sodium`: `node scripts/build-sodium-anatomy.mjs`
- `anatomy:sodium:audit`: `node scripts/build-sodium-anatomy.mjs --audit`

Add `src/anatomy/sodium-art.json` to `.prettierignore`; it is deterministic generated SVG data. There are no registry, touch-hook, dependency, README or package-script changes in this feature commit.

## Verification evidence (2026-10-23)

- Full `npm test`: 12 files, 172 tests pass, including five sodium tests covering parameters, exact converted glucose bound, blank/invalid values, unit equivalence, common scales, and 103 small/large-value samples.
- `npm run build` passes both TypeScript and the Vite bundle with temporary App integration. The temporary App changes are removed before commit.
- `node scripts/build-sodium-anatomy.mjs --audit`: 64 solids, 18 parameter poses, 308 combined order rules. Every audit category is zero in every pose, including support, sunk pairs, stand-in shapes and depth order. Samples include the glucose baseline, small/large inputs, and intermediate parameter positions.
- Authorized Anatomy `drive.mjs` runs at 1440×1100 and 390×844, plus 390×844 with `--reduced`, pass with clean browser consoles. They verify shared values/units, SI steps, pointer and keyboard input, invalid clearing, separate 44px targets, no overflow, settled/offscreen RAF sleep, native TouchEvent handle cancellation and uncancelled non-control touches. The offscreen assertion temporarily translates the SVG outside the viewport to make the observer test independent of page height.
- Light/dark, zero/raised correction and 4× mechanism close-ups inspected. Rooted-line checks report zero floating ends (358–360 ends, 79–80 texture paths depending on pose). A 12-frame slowed sheet verifies the eased follower and screw transition. No autoplay, shader, or exploded pose.
- T3 preview navigation worked; repeated snapshot calls timed out with `Preview automation snapshot timed out after 15000ms`. The named Anatomy capture/drive workflow supplied visual evidence instead.

Representative screenshots: `/tmp/sodium-desktop-figure.png`, `/tmp/sodium-phone-desktop.png`, `/tmp/sodium-phone-figure.png`, `/tmp/sodium-final-light-4x.png`, `/tmp/sodium-final-dark-4x.png`, `/tmp/sodium-final-light-zero-4x.png`, `/tmp/sodium-final-dark-zero-4x.png`, `/tmp/sodium-final-raised-4x.png`, `/tmp/sodium-final-motion.png`. Logs: `/tmp/sodium-final-audit.log`, `/tmp/sodium-final-combined.log`, `/tmp/sodium-final-phone.log`, `/tmp/sodium-final-reduced.log`.

Browser checks use Chromium. Native touch cancellation is exercised with actual TouchEvent dispatch, not a physical iOS/Safari device. The product card follows the existing fixed-light figure style; its dark drawing palette is also verified by setting the figure's `data-theme` in the harness.
