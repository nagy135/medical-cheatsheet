# Der Bilanzschrank — anion gap without potassium

Figure: a crafted two-bay comparison cabinet, about 55 solids.
Sodium fills the left bay. Chloride and bicarbonate stack in the right bay.
A lit strip on the center stile spans the difference between their upper edges.
All three inputs share the same scale and the main form's state. The strip has
length |AG|; the signed result and caption distinguish a positive gap, flush
edges, and a right stack extending above sodium. Zero is actually flush and
negative values are preserved. This illustrates arithmetic, not missing electric
charge or a complete inventory of ions. No clinical threshold is added.

Parts before geometry:

- Base: four leveling pads, four feet, sole, plinth, inset edge groove, screws.
- Cabinet: rear panel, two side walls, floor shelf, crown, center stile, two
  top end caps, four rear mounting pads and two rear footplates.
- Bays: variable sodium cassette, chloride cassette and bicarbonate cassette,
  each with real depth, plus the variable lit difference strip on the center stile.
- Drives: three moving carriages with bodies, lids, spindle bosses and knurled
  wheels. Sodium rides the left stile, chloride the right half of the center
  stile and bicarbonate the right outer stile. Their front layers never cross.
- Details: rooted ruler ticks on the center stile, front cabinet trim, corner
  mounting screws, four closed vent slots, lower service hatch and plaque.

World: base top z=0. Floor shelf z=12..20; all cassettes start at z=20.
Outer stiles x=−120..−110 and 110..120. Center stile x=−14..14. Body bays
x=−104..−20 and 20..104, y=−4..8. Cabinet rear panel ends at y=−10;
front stiles end at y=10. A 0.4-unit ruler strip sits on the center stile. The difference strip is on y=10.4..11.4, x=−12..−2.
Sodium and bicarbonate carriages move on the outer stiles; chloride uses
x=3..13, clear of the difference strip. Capacity is 180 drawing units, with a
common scale expanded for large inputs. Normalize before adding to avoid
intermediate overflow even when the original sequential subtraction is finite.

Static geometry is prebuilt; the three carriage groups translate along z.
Only the three cassette prisms and the difference strip change shape. Geometry
and browser use the same bounds. Solve a common painter order across ordinary,
zero, negative and extreme inputs, and audit true slab/disc shapes to zero.
Verify each input separately, exact cancellation, negative and zero output,
shared state, reset, invalid input, drag and keyboard, motion/reduced motion,
desktop/390px/4× screenshots and line ends. Commit, push, pull/build on nixpi
and verify the published page.
