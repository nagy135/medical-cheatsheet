# FENa · paired sample comparator

Figure tier, concept and parts inventory recorded before geometry (2026-10-23).

## Object and computation

A bench laboratory comparator holds two pairs of open-faced graduated sample cells. The left pair compares serum and urine sodium; the right pair compares serum and urine creatinine. Each cell has a round sample insert, a bayonet seat, a moving meniscus cap and a fixed calibration spine. Four front micrometer wheels change the four shared clinical inputs.

Within each analyte pair both columns use ONE automatically fitted linear concentration scale: height = 76 × concentration / max(serum, urine). Thus urine-height / serum-height is exactly U/S, including urinary sodium zero. A tiny concentration is allowed to be a tiny column, with no minimum-height fiction. The two scales are independent and their full-scale concentrations are stated below the drawing. Column heights express concentrations, not sample volumes or physical fluid levels. The calculator's own canonical function gives 100 × (U-Na/S-Na) / (U-Cr/S-Cr). No thresholds or diagnoses are added.

The serum cells sit on the left of each pair and have plain caps; urine cells sit to their right and have concentric cap engravings. One muted teal accent marks the sample inserts. The frame, four-foot cast bed, calibration spines, removable crossheads, round seats and four knurled adjustment wheels make a laboratory comparator, not a plotter, cabinet or circular slide rule.

## Parts inventory (74 solids at a positive reference pose)

- Bed: four elastomer pads, four leveling feet, sole plate, cast deck, inset service label = 11.
- Pair mounts: two raised twin-cell pedestals, two removable pedestal lids = 4.
- Each of four cells: seat flange, sample cup, fixed calibration spine, scale strip, crosshead, crosshead cap, variable sample insert, moving meniscus cap = 32.
- Four adjusters: wheel housing, housing lid, spindle collar, knurled wheel, dial face = 20.
- Service hatch and lid = 2; three closed ventilation slots = 3; two front retaining clips = 2.
- Total 74. At urinary sodium zero the zero-length sample insert is absent; its cap sits on the sample cup. Screws, closed seams, scale ticks and knurl ribs belong to the supporting parts and do not inflate the solid count.

## Geometry contract

World z is up. Cells are separated along x, calibrated spines sit behind each sample. All parts have true slab or turned-body audit shapes. The live inserts use the same vendored lathe renderer as the build. Moving caps translate along the projected z axis. The build solves a single painter order across reference, independent parameter changes, zero, equal and extreme concentrations and intermediate poses. Each pose also receives solid-clearance and full kit audit checks; no shape or collision exemptions.

## Interaction and motion

All four controls are spinbuttons with keyboard arrows and pointer capture; NumericInput controls include both independent creatinine unit switches. The parent owns raw values and selected units. Values are evaluated by evaluateCalculator before posing. Knob output converts canonical values back into the selected display unit, with its selected unit's registry step. useTouchLock(svgRef, '.fena-handle') cancels native touch scrolling only on controls. Empty/invalid values immediately hide every sample insert and meniscus, remove live datasets and show an em dash. Exponential follow is time based, stops at rest/offscreen/hidden, and reduced motion settles immediately. No automatic clinical input changes.

## Integration

Export FenaAnatomy from FenaAnatomy.tsx with raw, units, onChange, onUnitChange and onPreset. Presets are canonical display strings; the parent resets units. Route calculator id fena to this component. Add package commands for node scripts/build-fena-anatomy.mjs and its --audit variant; ignore generated src/anatomy/fena-art.json in Prettier. The registry remains the authority for formula, ranges, unit factors and clinical note.

## Verification commands

Generation: `node scripts/build-fena-anatomy.mjs`. Full geometry and solid-clearance audit: `node scripts/build-fena-anatomy.mjs --audit` (eleven poses, including independent inputs, zero, equal concentrations, reciprocal ratios and extremes). The generator solves one common painter order by part name even when the zero-length insert is absent.

After routing the component in App, start `npm run dev -- --port 5206 --strictPort`, then run:

```sh
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs 'http://localhost:5206/#/rechner/fena' --actions scripts/verify-fena-anatomy.json
node /Users/Viktor/.dots/agents/.agents/skills/anatomy/scripts/drive.mjs 'http://localhost:5206/#/rechner/fena' --width 390 --height 844 --actions scripts/verify-fena-anatomy.json
```

The browser sequence checks shared forms, every parameter, every creatinine unit pairing, selected-unit keyboard increments, drag, native cancelable touch events, separate 44px hit targets, zero, invalid and blank states, large values, both themes, line roots and offscreen suspension. It temporarily adds scroll room for the offscreen check so a tall desktop viewport can move the entire instrument out of view; it removes that spacer afterward. Screenshots go to `/tmp/fena-qa/`; change that prefix to keep separate runs. The sequence also captures an eight-frame slowed motion sheet and 4× views in both themes. Physical iOS hardware is not part of the automated browser check.

`npm test` covers the pure ratio model and all four unit combinations. `npm run build` was run both with temporary FENa routing (to bundle the feature) and after restoring App. The generated JSON should be added to the parent's Prettier ignore list; source files are formatted independently.
