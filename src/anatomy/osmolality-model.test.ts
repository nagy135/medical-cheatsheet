import { describe, it, expect } from 'vitest';
import { evaluateOsmolality, osmolalityPose, osmolalityExample } from './osmolality-model';
import { osmolalityInserts } from './osmolality-solid';
describe('Osmolality additive dosing bench', () => {
  it('adds two equal sodium doses and exact canonical glucose and urea contributions', () => {
    const p = osmolalityPose(osmolalityExample)!;
    expect(p.result).toBeCloseTo(290.54994394556616, 10);
    expect(p.contributions).toEqual([280, 100 / 18.0182, 5]);
    expect(p.doses).toEqual([140, 140, 100 / 18.0182, 5]);
    expect(p.heights[0]).toBe(p.heights[1]);
    expect(p.lengths.reduce((a, b) => a + b, 0)).toBeCloseTo(p.result * p.unit, 12);
  });
  it.each([
    ['sodium', 150, 20],
    ['glucose', 280.182, 10],
    ['urea', 15, 10],
  ] as const)('only %s changes its true contribution and geometry', (field, value, delta) => {
    const base = osmolalityPose(osmolalityExample)!,
      p = osmolalityPose({ ...osmolalityExample, [field]: value })!;
    expect(p.result - base.result).toBeCloseTo(delta, 10);
    const i = { sodium: 0, glucose: 1, urea: 2 }[field];
    for (let j = 0; j < 3; j++) {
      if (i === j) expect(p.lengths[j]).not.toBe(base.lengths[j]);
      else expect(p.lengths[j]).toBe(base.lengths[j]);
    }
    expect(p.heights[field === 'sodium' ? 0 : field === 'glucose' ? 2 : 3]).not.toBe(
      base.heights[field === 'sodium' ? 0 : field === 'glucose' ? 2 : 3],
    );
  });
  it('uses parent display units with exact mg/dl/mmol/l conversions', () => {
    const canonical = evaluateOsmolality({ sodium: '140', glucose: '180,182', urea: '5' }).pose!;
    const si = evaluateOsmolality(
      { sodium: '140', glucose: '10', urea: '30,03' },
      { glucose: 1, urea: 1 },
    ).pose!;
    expect(canonical.result).toBe(295);
    expect(si.result).toBe(canonical.result);
    expect(si.lengths).toEqual(canonical.lengths);
    expect(si.heights).toEqual(canonical.heights);
    // Unit indices are real inputs: retaining the same display numbers changes the computation.
    const other = evaluateOsmolality({ sodium: '140', glucose: '10', urea: '30,03' }).pose!;
    expect(other.result).not.toBe(si.result);
    expect(other.heights).not.toEqual(si.heights);
  });
  it.each([
    osmolalityExample,
    { sodium: 1e-6, glucose: 1e-6, urea: 1e-6 },
    { sodium: 1e6, glucose: 100, urea: 5 },
    { sodium: 140, glucose: 1e7, urea: 5 },
    { sodium: 140, glucose: 100, urea: 1e6 },
  ])('preserves true hopper volume and additive lengths at %j', (v) => {
    const p = osmolalityPose(v)!;
    p.heights.forEach((h, i) => {
      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThanOrEqual(64 + 1e-10);
      expect((10 * h + (14 / 64) * h * h) / p.doseUnit).toBeCloseTo(p.doses[i], 7);
    });
    expect(p.lengths.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(252 + 1e-10);
    p.lengths.forEach((l, i) => expect(l / p.unit).toBeCloseTo(p.contributions[i], 7));
    const inserts = osmolalityInserts(p);
    expect(inserts).toHaveLength(7);
    expect(inserts[4].x).toBe(-126);
    expect(inserts[6].x + p.lengths[2]).toBeCloseTo(-126 + p.result * p.unit, 10);
  });
  it('keeps finite geometry even at the registry’s unbounded upper range', () => {
    const p = osmolalityPose({ sodium: 140, glucose: 100, urea: 1e308 })!;
    expect(Number.isFinite(p.result)).toBe(true);
    expect(p.heights.every(Number.isFinite)).toBe(true);
    expect(p.heights[3]).toBeCloseTo(64, 10);
    expect(p.lengths.every(Number.isFinite)).toBe(true);
    expect(p.lengths[2]).toBeCloseTo(252, 10);
  });
  it('hides geometry on incomplete, invalid or nonfinite values', () => {
    for (const raw of [
      {},
      { sodium: '140', glucose: '', urea: '5' },
      { sodium: '-1', glucose: '100', urea: '5' },
      { sodium: '140', glucose: 'abc', urea: '5' },
      { sodium: '140', glucose: '100', urea: '0' },
    ])
      expect(evaluateOsmolality(raw as Record<string, string>).pose).toBeNull();
    expect(osmolalityPose({ ...osmolalityExample, glucose: Infinity })).toBeNull();
    expect(osmolalityPose({ ...osmolalityExample, sodium: NaN })).toBeNull();
  });
});
