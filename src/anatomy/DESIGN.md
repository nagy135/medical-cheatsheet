# Anatomy instruments

## First individual instrument: MAP

MAP now uses a dedicated 67-part straightedge instrument. The original MAP
parts plan is in `docs/anatomy-map/README.md`; `scripts/map-geometry.mjs` builds
the real geometry. A diagonal straightedge connects two pressure heights; its
bright readout sits at x = −40, one-third of the 240-unit span from x = −120.
Both the displayed result and the physical readout use `map.calculate` from the
registry. A fixed 0–240 mmHg scale makes either input's effect visible; a larger
labelled scale accommodates pressures beyond it. Heights map from 30 to 160,
so the shoes stay clear of both end stops. The original form and the instrument
share the same raw values, starting at the explicit 120/80 example.

Audit all real shapes, including the two changing straightedge prisms, at the
reference pose, equal endpoint pressures, full span, tiny pressures and expanded
scale. Assert the effect of each input numerically and visually, synchronization
in both directions, reset and invalid values. Generate static paths once and
update only transforms and changing beam-face paths per frame.

Size: Figure, one 40–80-part plotting instrument reused for the 20 formulas. Each calculator gets its own input scales, explanation and intermediate quantities; the actual registry calculation drives its curve, pen and readout. This is a mathematical instrument, not a model of anatomy or of a medical device.

The pen's x position is the selected input; its y position is the calculated output while all other inputs are held constant. A gantry travels along two supported rails and a pen carriage travels along its crossbeam. The pen touches the graph paper. The plotted curve is the formula evaluated over the visible input interval. Invalid inputs interrupt the trace instead of being clamped or extrapolated. Axis endpoints and units appear in the caption; the visible intervals are scale choices, never clinical reference ranges.

## Parts, before geometry

- Base: cast plate, sole, four feet, four leveling pads, perimeter groove, corner screw rings and centers.
- Paper bed: paper sheet, four bezel strips, four retaining clips, rooted grid and axis ticks, a single engraved scale nameplate.
- Guides: two y rails, four rail pedestals, four end stops, two motor mounting plates, two motor covers, two ruler strips.
- Gantry: two bearing pads, two upright shoes, two bearing lids, crossbeam, crossbeam end plates, two assembly screw pairs.
- Pen head: carriage, cap, two guide pads, shaft boss, thumbwheel, knurled crown, pen barrel, tip and paper contact.
- Controls: controller body and lid, knob pedestal and knob crown, mounting screw rings and closed ventilation slots.

Only the pen assembly is lit. Base and feet are low tone; structure is middle tone. Every solid has its actual recorded audit shape; all contacts are flush. Static paths are generated once, and live groups move through projection vectors without rebuilding the art.

## Product integration

The bordered section sits immediately after the input/result panels. Its values start from the calculator's examples, explicitly labelled as such. It has the same numeric input, unit conversion and validation behavior as the main calculator. Users explicitly import values from the main form or apply the alternate values to that form. Changing a selected axis does not change a calculation.

The main result and intermediate steps belong to the alternate form. The caption's “Am Stift” readout belongs to the current animated pen pose and uses that pose's exact inputs. A deliberate “Kurve abfahren” mode explores a curve without modifying form values. Pointer dragging and native range keyboard controls change the selected input. Motion stops offscreen and when the tab is hidden; reduced motion snaps immediately.

## Verification

Check coverage of all 20 registry entries, independent numeric benchmarks, converted units, signed gaps, CKD-EPI branches, integer fields and relation validation. Audit resting and representative moving poses, prove painter order, check line ends, inspect desktop/390px and 4× crops. Build and test locally, then commit and publish, pull on nixpi and build and deploy that exact commit there.
