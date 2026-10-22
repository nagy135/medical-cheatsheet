# Die O₂-Normierbank — Horovitz index

Figure: an oxygen-blending demonstration bench with a composition window and
a twin manometer, about 60 solids. It differs from the earlier bridge, aperture,
balance, cabinet and circular slide rule.

The left window represents a whole gas sample. Its movable divider leaves
FiO₂/100 of the length for oxygen and the rest for other gases. This is a
composition illustration, not separated gas layers or prescribed flow rates.
On the right, two pressure columns share a scale: measured PaO₂ and the
calculated quotient PaO₂/(FiO₂/100). The second column is the lit subject.
PaO₂ is an independent measurement; the drawing does not predict a physiological
response or pressure at a different oxygen setting. No ARDS thresholds are added.

The main and lower form share both raw values AND unit selections. kPa/mmHg and
fraction/percent changes preserve canonical values. The original registry owns
conversion factors, ranges, formula and displayed result. Presets reset units to
mmHg/percent; native sliders follow the selected units. Instrument dragging uses
canonical values, converted to the current unit before updating shared state.

Parts before geometry:

- Base: four leveling pads, four feet, sole, plinth, inset groove and screw rings.
- Mixer: foot, rear housing, floor, two side cheeks, top bridge, front sill,
  movable oxygen/rest-gas inserts, divider, moving carriage, spindle and wheel.
- Manometer: foot, backplate, three vertical stiles, sill, crown, two ruler strips,
  two pressure inserts and two level carriages, plus a PaO₂ knob.
- Connections: broad closed manifold underneath the two modules with a service
  hatch, screw heads and closed vent slots; no exposed pipes or implied blood
  circulation connecting the input mix to the measured arterial pressure.
- Finish: rear mounting pads, top caps, calibration plaque, three engraved strips.

World base top z=0. Mixer at x=−128..−16, body z=12..112; window at
x=−120..−24, y=0..10, z=26..92. Its divider spans 0.21..1 of the usable width.
The front carriage rides a separate sill below the window, clear of both
inserts. The two pressure columns sit at x=20..43 and 65..88, start at z=24,
and reach at most 180 units. Their common scale is at least 400 mmHg and
extends for larger valid pressures. At FiO₂=100%, both columns have equal height.

Prebuild static geometry and translate the divider carriage. Rebuild only the
window inserts, divider and two pressure prisms from shared bounds. Audit true
solids and a common painter order across ordinary values, pure oxygen, 21%,
small pressures and extended scales. Verify both independent effects, inverse
FiO₂ dependence, equal columns at 100%, unit invariance and synchronized unit
changes, invalid/reset/example handling, drag/keyboard, reduced/offscreen motion,
desktop/390px/4× pictures, line ends and calm motion. Commit/push, pull/build on
nixpi, and check the published page.
