# Mean arterial pressure: an interpolating instrument

Figure size. A two-input measuring bench lifts the ends of a telescoping straightedge to diastolic and systolic pressure. A third shoe, fixed one-third of the horizontal span from the diastolic end, follows the straightedge and reads the repository's estimated MAP. This is a mathematical teaching instrument, not a representation of a medical device or an arterial waveform.

The build imports the actual `map` entry from `src/calculators.ts` using Node's native TypeScript support (Node 22.18+). Its calculation drives every readout and the height of the output shoe. The two endpoint heights drive the straightedge. The formula's 1:2 weighting is an approximation at usual heart rates; the true MAP is a time average of the arterial waveform.

## Parts planned before geometry

- Base: cast plate, underside sole, four feet, four leveling pads, four corner screw heads, perimeter groove, nameplate, nameplate fasteners, three engraved rules.
- Structure: three upright footplates, six footplate screws, three scale backbones, six edge rails, three scale strips, three top caps, three lower stops, three upper stops.
- Mechanism: two input slider bodies, output slider body, six slider bearing pads, three forward shoes, two straightedge sections, straightedge inset strip, three pivot bosses, three pivot caps, three pivot screws, output witness strip.
- Controls: two ribbed input thumbwheels, their two shafts and mounting lugs, and a fixed output collar. Input and output numbers appear in the readout bank below the instrument.

Every component is supported by the base or by a flush contact with its parent. The central shoe is the one illuminated subject. World: x along the 240-unit span, y front to back, z pressure height; the output is at x = −40, between the endpoints at −120 and +120. Camera azimuth 68°, elevation 25°.

## Rebuild

From the repository root: `node docs/anatomy-map/build.mjs` (also builds the light page). Add `--audit` to check all geometry and representative input poses. Open `index.html` directly; it has no network dependencies. The vendored Anatomy kit is MIT licensed.

`verify-actions.json` replays the sensitivity examples, keyboard limits, direct endpoint drag and theme switch using the Anatomy skill's `scripts/drive.mjs`. The geometry audit also checks that the initial painter's order remains valid in the other poses used by the page.

The controls use illustrative ranges, in mmHg. They preserve systolic ≥ diastolic, as the repository requires. Drag either endpoint, use the sliders with a pointer or keyboard, or start the idle tour. Any manual input pauses the tour. Reduced motion changes poses immediately.

Medical references: [repo reference / StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK538226/) and [AHA scientific statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC11409525/).
