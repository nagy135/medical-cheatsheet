import { describe, expect, it } from 'vitest';
import { mapExample, mapPose, pressureHeight } from './map-model';

describe('unique MAP instrument', () => {
  it('gives systolic and diastolic edits their distinct 1:2 effects', () => {
    const baseline = mapPose(mapExample)!;
    const systolic = mapPose({ ...mapExample, systolic: 150 })!;
    const diastolic = mapPose({ ...mapExample, diastolic: 110 })!;
    expect(baseline.result).toBeCloseTo(93.33333333333333, 10);
    expect(systolic.result - baseline.result).toBeCloseTo(10, 10);
    expect(diastolic.result - baseline.result).toBeCloseTo(20, 10);
    expect(systolic.heights[0]).toBe(baseline.heights[0]);
    expect(diastolic.heights[2]).toBe(baseline.heights[2]);
    expect(systolic.heights[1] - baseline.heights[1]).toBeCloseTo((130 * 10) / 240, 10);
    expect(diastolic.heights[1] - baseline.heights[1]).toBeCloseTo((130 * 20) / 240, 10);
  });
  it.each([
    [120, 80],
    [90, 60],
    [120, 120],
    [240, 1],
    [400, 200],
    [1, 1],
  ])(
    'puts the readout exactly one third along the straightedge at %s/%s',
    (systolic, diastolic) => {
      const pose = mapPose({ systolic, diastolic })!;
      expect(pose.heights[1]).toBeCloseTo(
        pose.heights[0] + (pose.heights[2] - pose.heights[0]) / 3,
        10,
      );
      expect(pose.heights.every((h) => h >= 30 && h <= 160)).toBe(true);
    },
  );
  it('holds the scale still for ordinary edits and visibly expands for values beyond it', () => {
    expect(mapPose(mapExample)!.scale).toBe(240);
    expect(mapPose({ systolic: 180, diastolic: 100 })!.scale).toBe(240);
    expect(mapPose({ systolic: 400, diastolic: 200 })!.scale).toBe(400);
    expect(pressureHeight(0)).toBe(30);
  });
  it('does not display a stale calculated pose for invalid pressures', () => {
    for (const values of [
      { systolic: 80, diastolic: 120 },
      { systolic: 120, diastolic: 0 },
      { systolic: NaN, diastolic: 80 },
      { systolic: Infinity, diastolic: 80 },
    ])
      expect(mapPose(values)).toBeNull();
  });
});
