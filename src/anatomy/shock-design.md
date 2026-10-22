# Die Verhältniswaage — shock index

Figure: a two-pan numerical balance with a sliding fulcrum, about 50 solids.
The left model weight represents the heart-rate number, the right the systolic
pressure number. Their shared height scale preserves their ratio. The beam is
idealized as massless; model weights represent numbers, not physical clinical units.
For endpoints −100 and +100, the balanced fulcrum is
p = 100 × (P − H) / (P + H). The arms are a = p + 100 and b = 100 − p;
H × a = P × b, so SI = H/P = b/a. No clinical thresholds or diagnosis are added.

The object differs from MAP's rising bridge and Mosteller's aperture: two round
weighing pans, calibrated cylinders and a single support that slides horizontally
under a fixed level beam. Both numeric fields share state with the original form.
Changing a weight changes its height and the support's position. Multiplying both
inputs by the same factor preserves the support position and the index.

Parts before geometry:

- Base: four leveling pads, four feet, sole, plinth, inset edge groove, screw rings.
- Track: two guide rails, two end stops, four end-stop bolt pads, ruler strip.
- Moving support: slide body, lid, column, top bearing plate, bearing cylinder,
  bearing cap and front pointer tab; the column is the lit subject; the support stays below the beam.
- Beam: level beam, two pan mounts, two pan floors, two raised annular rims.
- Weights: two variable cylinders, two cap plates, two cap spindles and two
  knurled crowns. The crowns can be dragged vertically to change the inputs.
- Base fittings: calibration plaque, three short engraved strips, two controller
  housings, two lids and four screw pads.

World: base top at z=0; rails 0..4; slide 4..12; column 12..84;
bearing plate 84..88; bearing disc to z=90; beam 90..96. Pans sit at z=96..99,
weights stand on their floors at z=98. Raised rims sit outside the weight radius.
The support can travel across −100..100; no body crosses the beam or pan floor.

Prebuild static parts, translate the support along x and caps along z. Only the
two cylinder bodies change geometry. Solve painter order across all tested ratios
and scales from real overlap constraints. Audit true discs, rings and slabs;
inspect desktop/390px/4×, line ends, motion, both inputs, shared state, invalid
values, reset, keyboard, dragging and proportional scaling. Commit, push, pull
and build on nixpi, then verify the delivered page.
