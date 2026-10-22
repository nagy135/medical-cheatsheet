# Der Korrekturschlitten — albumin-corrected calcium

Figure, 40–80 parts: a two-stage precision translation table, distinct from the
pressure columns, balance and circular slide rule. Measured calcium translates
the lower carriage along a fixed bed. A second rail rides on that carriage;
albumin offsets its lit upper carriage by 0.02 × (40 − albumin). The upper
carriage's absolute coordinate is the corrected calcium. At 40 g/l the carriage
centres align; above 40 the offset reverses. This is arithmetic displacement,
not a physiological simulation or a measurement of ionized calcium.

Use the registry's formula, validation, conversion factors and result precision.
Both forms share raw values and albumin unit selection (g/l or g/dl). Keep signed
results, including negative ones accepted by the existing calculation. No new
clinical thresholds. Numeric units remain explicit in captions, not geometric
length mistaken for clinical units.

Parts before geometry:

- Base: four pads, four feet, sole, beveled plinth, inset groove and screws.
- Bed: two footplates, bedplate, two longitudinal guide rails, two end stops,
  four fastening pads, front scale strip, zero witness block and reference witness at x50.
- Lower carriage: bearing shoe, main body, screwed cover and rear index fin; carries the upper bed.
- Upper bed: rear and front runners, two end stops, a calibration ruler and a
  centred witness strip; all translate with the lower carriage.
- Upper carriage: bearing shoe, lit head, lit lid and front pointer tongue.
- Drive controls: two base-mounted control housings, two lids, two spindle
  collars, two knurled wheels and two dial inserts. They change the shared
  numeric inputs; the visible mechanism is an idealized coordinate adder.
- Finish: service hatch, lid, four closed vent inserts, engraved identification
  plate and three short inset strips.

World: base x −165..165, y −30..92, top z0. Bed x −150..150,
y −16..16, top12; rails top18. Lower carriage x M±10, y−16..16,
z18..26. Upper rail x M±60, y−10..10, z26..32. Upper carriage
x R±6, y−12..12, z32..52. No carriage intersects its guide; shoes
meet guide top planes. Front pointer sits on upper head front face.

Coordinates: unit=min(36,120/calcium); zero=−70; M=zero+calcium×unit;
R=M+correction×unit. For large calcium values the common scale expands;
upper bed has a fixed physical length and correction displacement shrinks
consistently with the common scale. Mechanical control housings are far apart
on the front apron for two separate 44px targets even at 390px.

Audit real slabs/discs and a shared painter order across positive, zero and
negative corrections, minimum/large calcium, and negative/zero output.
Verify both independent effects, albumin unit conversion, exact signed formula,
reset/errors/example, knobs/keyboard, desktop/phone/4x, reduced/offscreen motion.
Commit, push and deploy to nixpi, then verify source SHA and public page.
