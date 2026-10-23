# PBW dosing carousel — Figure

Concept written before geometry: six equal open measuring chambers on a circular indexed tray contain six equal PBW measures. Raising all six measures by the same amount makes the sixfold multiplication tangible. A knurled height wheel sets height; a two-position formula shuttle changes the baseline. This is a mathematical dosing carousel, not a ventilator or a depiction of lung volume.

## Truth and mapping

The registry `atemzugvolumen` owns the formula, limits, validate function and clinical note. Evaluate raw display values using `evaluateCalculator(calculator, raw, units)`. Each measure represents PBW × 1 ml/kg; six together represent the registry result at 6 ml/kg. The graphical volume height is 0.5 world units per kg PBW, with the same cross-section and fixed scale in every chamber. Formula selection changes both all six volumes and the physical two-position selector. Invalid or empty inputs hide all variable parts and all numeric results immediately. No actual weight input. There are currently no switchable units in the registry; the complete units/onUnitChange interface remains available.

## Parts list (before geometry)

- Stand: four rubber pads and four feet (8), rounded sole plate (1), lower bearing drum (1), upper bearing ring (1), circular carousel deck (1).
- Six chambers: six bottom measuring seats (6), eighteen slender guide posts (18), six open annular upper collars (6), six variable equal-volume measures (6).
- Central index: spindle foot, spindle, engraved top cap (3).
- Height control: wheel mounting block, neck, knurled wheel, inset dial (4).
- Formula selector: switch pedestal, detent rail, moving shuttle (3).
- Identification: screwed engraved plate (1).

Total: 59 true solids. Screws, tick rings and knurls are rooted surface detail, not counted as solids. Every solid is recorded with its actual shape. No pipes, free cables, explosion or disassembly modes.

## Motion and access

Only user edits move the carousel. Exponential following of PBW drives the same instantaneous fill geometry and SVG footer. The formula shuttle follows the categorical choice without interpolating clinical sex values. Reduced motion settles immediately. IntersectionObserver and document visibility suspend frames offscreen; settled figures stop requesting frames. Handles offer >=44 CSS px targets, pointer capture, cancellation, keyboard control and value text. Native nonpassive touch cancellation uses `useTouchLock(svgRef, '.pbw-handle')`; the rest of the SVG permits page scrolling.

## Integration and verification

Export `PbwAnatomy` from `src/anatomy/PbwAnatomy.tsx`. Props: `raw`, `units`, `onChange(field,value)`, `onUnitChange(field,index)`, `onPreset(values)`. Route only calculator `atemzugvolumen` to it and pass the main form state. Presets supply canonical display strings; the parent resets units. Keep the registry unchanged. Lazy loading is recommended because generated art is about 350 kB uncompressed.

Parent-owned package entries should be `anatomy:pbw: "node scripts/build-pbw-anatomy.mjs"` and `anatomy:pbw:audit: "node scripts/build-pbw-anatomy.mjs --audit"`. Add `/src/anatomy/pbw-art.json` to the generated-art formatting ignore. No shared integration files are included in this feature commit.

Commands available without package changes:

```sh
node scripts/build-pbw-anatomy.mjs
node scripts/build-pbw-anatomy.mjs --audit
npm test
npm run build
npm run dev -- --port 5204 --strictPort
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs http://localhost:5204/#/rechner/atemzugvolumen --actions scripts/verify-pbw-anatomy.json
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs http://localhost:5204/#/rechner/atemzugvolumen --actions scripts/verify-pbw-anatomy.json --width 390 --height 844
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs http://localhost:5204/#/rechner/atemzugvolumen --actions scripts/verify-pbw-anatomy.json --reduced --no-webgl
```

The browser suite expects the parent's route integration (or temporary local wiring) and begins with an empty calculator. It exercises both categorical choices, both directions of shared input synchronization, pointer capture, keyboard controls, native cancellable touch events and cancellation recovery, blank/invalid geometry, 44px targets, absence of horizontal overflow, both-theme rooted-line checks, offscreen suspension and absence of idle animation writes. The offscreen test temporarily adds a page spacer so it works even when all original content fits within a tall viewport. Screenshots are written to `/tmp/pbw-qa/`; use a copied action file with renamed output paths to retain separate mobile/reduced runs.

Validated: 59 actual recorded solids; all failing audit counts zero over 38 poses including both formula choices, the upper height boundary and near-zero positive female PBW. The registry rejects zero and negative PBW. Browser line checks report zero floating ends (102 checked ends, 39 line elements); desktop, 390px, reduced motion and SVG-only runs have clean consoles. Minimum/maximum 4× captures in both themes additionally confirm true collar openings and smooth cylindrical shading. No explosion, shader, autonomous clinical-input tour or actual weight control exists.

Unknown untracked PBW drafts found during the task were retained outside `src` at `/tmp/pbw-draft-backup/PbwInstrument-original.tsx` and `/tmp/pbw-draft-backup/verify-PBW-original.json`. The moved originals preserve metadata. Their originating author could not be established from Git history; they are not part of the committed implementation.
