# Die Verdünnungskammer — free-water deficit

Figure, 40–80 real parts: an open calibrated expansion chamber on a laboratory
bench. One neutral volume insert represents current estimated total body water;
a highlighted insert beside it represents the calculated additional volume.
Both have the same cross-section, so their lengths preserve their volume ratio.
A sliding end wall reads the combined volume. A separate witness on the front
lip marks the boundary of current body water. At sodium 140, the extra insert
has exactly zero length and the end wall aligns with the witness.

The model uses the original registry: TBW=weight×bodyWaterFraction and deficit=
TBW×(sodium/140−1). The volume ratio is sodium/140, so the normalized numerical
product sodium×TBW is conserved at 140×(TBW+deficit). These are explanatory
volume inserts, not separated physiological compartments, measured body water,
a pump, infusion or simulation of serum sodium over time. Clinical source text
and formula stay unchanged. All three fields share raw state with the main form.

Parts before geometry:

- Base: four pads, four feet, sole, plinth, inset groove and corner screws.
- Chamber support: two screwed feet and the thick floor plate.
- Chamber walls: back wall with wraparound seams, left wall, right travel stop,
  front low sill, back crown and two screwed end caps.
- Measurement: front ruler strip, current-body-water witness and its foot,
  moving end wall and its screwed top cap; grey and lit volume inserts.
- Controls: three mounted control bodies, three lids, three spindle collars,
  three knurled wheels and three dial inserts (weight, sodium, water factor).
- Finish: service hatch, lid, three closed vents, engraved identification plate,
  three inset rule strips.

World: base x−158..158, y−32..88, top0. Footplates0..8; floor8..14,
x−134..134, y−20..24. Back wall y−20..−12 from14..82; left wall
x−134..−126, right stop126..134. Inserts begin x−126, occupy y−12..12,
z14..74. Front sill y12..18,z14..20. Current witness sits on a separate front calibration rail
y22..24,z20..76, clear of the end wall (y−12..12), including zero deficit.
End wall begins exactly after the inserts, thickness4, z14..78, cap78..80.
A ruler on the calibration rail's front face provides rooted ticks. Controls sit far apart
at x−110,0,110,y65 on the front apron for three separate44px targets on phones.

unit=min(3.6,240/(TBW+deficit)); both inserts use that one scale. Ordinary
70kg/.6/170 gives42l+9l, lengths151.2+32.4. Large values expand the common
scale rather than clip either volume. Empty deficit draws nothing, no minimum
visible length. One union painter order is solved from actual slabs/discs over
ordinary values, each independent control, zero deficit, tiny volumes and large
volumes/Na. Only variable insert geometry is rebuilt; rigid end and witness
translate. No WebGL is needed for solid explanatory measuring inserts.

Check arithmetic, all input sensitivities, equivalent TBW products, dilution
identity, zero deficit, bounds and extended scale. Audit true shapes and order;
check desktop/390px/4x, rooted lines in every preset, drag/keyboard, reset/errors,
example, reduced/offscreen motion and slow transition. Commit/push, pull/build
on nixpi and verify the live URL and released SHA.
