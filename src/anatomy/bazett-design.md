# Die Bazett-Scheibe — QTc after Bazett

Figure: a circular slide rule, 56 solids. This is a horizontal round
instrument, distinct from the bridge, aperture, balance and cabinet.
QT sets a neutral pointer on a logarithmic angular scale. Heart rate gives
RR = 60 / HR seconds and gain = 1 / sqrt(RR). The inner scale rotates by
k × ln(gain). The bright output pointer is at k × ln(QT/400) + k × ln(gain),
so the fixed outer scale reads QTc = QT × gain. The drawing is an arithmetic
instrument, not a recorded ECG or an animation of a measured heartbeat.

A shared scale factor k fits both pointer directions and the rotor offset
within ±105° without wrapping, including the registry's extreme valid inputs.
Ordinary examples use a fixed 80° per doubling. Tick positions use the same k.
At 60/min, gain is one and both pointers have the same direction. At fixed QT,
120/min gives sqrt(2) times QT, and 30/min gives QT/sqrt(2). No clinical limits
are added; the original Bazett note remains under the calculator.

Parts before geometry:

- Base: four leveling pads, four feet, sole, plinth, edge groove and corner screws.
- Dial case: mounting foot, lower housing, shoulder ring, face carrier, fixed
  outer scale plate, inner rotating scale disc and four mounting screws.
- Rotor: raised witness bar and four small circular fasteners. Their positions
  rotate in world x/y; the disc is circular but its scale and witness rotate.
- Axle: lower spindle, QT pointer, spacer spindle, corrected pointer, center
  cap and knurled retaining crown. Each part meets the next at a z plane.
- Controls: two separate front consoles, each with body, lid, knob pedestal
  and knurled crown. Left controls heart rate, right controls QT. Their large
  pointer/keyboard targets stay apart on phones.
- Finish: four closed face vents outside the rotor, formula plaque, three
  short closed rule strips, four base corner washers and a rear service cover
  with three closed vents.

The pointer prisms occupy separate layers (QT z=25..27; QTc z=31..33).
The rotor witness and fasteners stay below z=20. The two needles are convex
filled polygons reprojected after their planar rotation; SVG screen rotation
would be incorrect in this perspective. The build and runtime share the exact
polygons and SVG face generator. True discs and prisms are audited across input
limits and ordinary poses. The painter order is solved across all sampled poses.
The two scale textures rotate/rebuild from the same model, with ticks rooted on
their circle outlines. One accent marks the corrected pointer.

Verify numerical references, both independent input effects, square-root heart
rate scaling, identity at 60/min, all input bounds, main/lower synchronization,
invalid/reset/example handling, both knobs by drag and keyboard, reduced motion,
offscreen suspension, desktop/390px/4× screenshots, motion, and line ends.
Commit and push, pull/build on nixpi, then verify the published page.
