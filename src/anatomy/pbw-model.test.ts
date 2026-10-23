import { describe, it, expect } from 'vitest';
import { evaluateCalculator } from '../calculators';
import { pbwCalculator, pbwPose, pbwCenters } from './pbw-model';
import { pbwMeasure } from './pbw-solid';
describe('PBW six-chamber carousel', () => {
  it.each([
    [175, 1, 70.566],
    [175, 0, 66.066],
    [190, 1, 84.216],
    [152.4, 1, 50],
    [152.4, 0, 45.5],
  ])('height %s, formula %s maps each of six equal volumes', (height, sex, pbw) => {
    const p = pbwPose({ height, sex })!;
    expect(p.pbw).toBeCloseTo(pbw, 10);
    expect(p.result).toBeCloseTo(pbw * 6, 10);
    expect(p.measureHeight).toBeCloseTo(pbw * 0.5, 10);
    expect(p.result).toBe(pbwCalculator.calculate({ height, sex }));
  });
  it('height and both categorical choices change real geometry', () => {
    const male = pbwPose({ height: 175, sex: 1 })!,
      female = pbwPose({ height: 175, sex: 0 })!,
      tall = pbwPose({ height: 190, sex: 1 })!;
    expect(male.result - female.result).toBeCloseTo(27, 10);
    expect(male.selectorX).not.toBe(female.selectorX);
    expect(tall.measureHeight).toBeGreaterThan(male.measureHeight);
    expect(pbwCenters).toHaveLength(6);
    const projection = { origin: [0, 0], xVector: [1, 0.5], yVector: [-1, 0.5], zVector: [0, -1] };
    expect(pbwMeasure(projection, 0, 0, male.measureHeight)).not.toBe(
      pbwMeasure(projection, 0, 0, female.measureHeight),
    );
  });
  it('uses German display raw values, registry units, and registry validation', () => {
    expect(
      evaluateCalculator(pbwCalculator, { height: '152,4', sex: '0' }, { height: 0 }).result,
    ).toBe(273);
    // There are no alternate units for either field in the registry.
    expect(pbwCalculator.fields.every((f) => !f.units)).toBe(true);
    for (const raw of [
      { height: '', sex: '1' },
      { height: '175', sex: '' },
      { height: 'abc', sex: '1' },
      { height: '175', sex: '2' },
      { height: '99', sex: '1' },
      { height: '251', sex: '0' },
      { height: '100', sex: '0' },
    ])
      expect(evaluateCalculator(pbwCalculator, raw, {}).result).toBeNull();
    expect(evaluateCalculator(pbwCalculator, { height: '100', sex: '0' }).formError).toBe(
      pbwCalculator.validate!({ height: 100, sex: 0 }),
    );
  });
  it('rejects nonpositive PBW and illegal values rather than clamping clinical results', () => {
    for (const v of [
      { height: 100, sex: 0 },
      { height: 250.1, sex: 1 },
      { height: 175, sex: 2 },
      { height: NaN, sex: 1 },
      { height: Infinity, sex: 0 },
    ])
      expect(pbwPose(v)).toBeNull();
    for (const sex of [0, 1])
      for (let height = 100; height <= 250; height += 0.5) {
        const p = pbwPose({ height, sex });
        if (p) {
          expect(p.measureHeight).toBeGreaterThan(0);
          expect(p.measureHeight).toBeLessThan(70);
          expect(p.measureHeight * 12).toBeCloseTo(p.result, 10);
        } else expect(pbwCalculator.validate!({ height, sex })).toBeTruthy();
      }
  });
});
