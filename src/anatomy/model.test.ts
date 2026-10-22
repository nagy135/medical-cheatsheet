import { describe, expect, it } from 'vitest';
import { calculators, evaluateCalculator } from '../calculators';
import {
  anatomySpecs,
  exampleRaw,
  importMainValues,
  inputInterval,
  resultForPose,
  traceCurve,
} from './model';

const get = (id: string) => calculators.find((c) => c.id === id)!;
const example = (id: string) => evaluateCalculator(get(id), exampleRaw(get(id))).values;

describe('Anatomy coverage and plotted calculations', () => {
  it('provides axes, ranges and finite values for every calculator with Anatomy enabled', () => {
    const enabled = calculators.filter((c) => c.anatomy !== false);
    expect(Object.keys(anatomySpecs).sort()).toEqual(enabled.map((c) => c.id).sort());
    for (const calculator of enabled) {
      const spec = anatomySpecs[calculator.id],
        values = example(calculator.id);
      expect(calculator.fields.find((f) => f.id === spec.axis)?.options).toBeUndefined();
      expect(spec.explanation.length).toBeGreaterThan(80);
      for (const step of spec.steps(values)) expect(Number.isFinite(step.value)).toBe(true);
      for (const field of calculator.fields.filter((f) => !f.options)) {
        const [min, max] = inputInterval(calculator, field, values[field.id]);
        expect(min).toBeLessThan(max);
        const curve = traceCurve(calculator, values, field);
        const point = curve.points.find((p) => p.x === values[field.id]);
        expect(point?.result).toBe(evaluateCalculator(calculator, exampleRaw(calculator)).result);
        expect(curve.y[0]).toBeLessThan(point!.result!);
        expect(curve.y[1]).toBeGreaterThan(point!.result!);
      }
    }
  });
  it('preserves the actual CKD-EPI transition for both formula parameters', () => {
    const calculator = get('egfr'),
      axis = calculator.fields.find((f) => f.id === 'creatinine')!;
    for (const [sex, kappa] of [
      [0, 0.7],
      [1, 0.9],
    ]) {
      const values = { ...example('egfr'), sex };
      expect(
        traceCurve(calculator, values, axis).points.some((p) => p.x === kappa && p.result !== null),
      ).toBe(true);
    }
  });
  it('includes the MAP boundary and omits invalid points beyond it', () => {
    const calculator = get('map'),
      values = example('map');
    const curve = traceCurve(
      calculator,
      values,
      calculator.fields.find((f) => f.id === 'diastolic')!,
    );
    expect(curve.points.find((p) => p.x === 120)?.result).toBe(120);
    expect(curve.points.filter((p) => p.x > 120).every((p) => p.result === null)).toBe(true);
    expect(resultForPose(calculator, { systolic: 80, diastolic: 120 })).toBeNull();
  });
  it('keeps signed results and a true zero crossing in gap plots', () => {
    const calculator = get('anionenluecke'),
      values = { sodium: 140, chloride: 120, bicarbonate: 25 };
    expect(resultForPose(calculator, values)).toBe(-5);
    const curve = traceCurve(
      calculator,
      values,
      calculator.fields.find((f) => f.id === 'bicarbonate')!,
    );
    expect(curve.points.some((p) => p.result !== null && p.result < 0)).toBe(true);
    expect(curve.points.some((p) => p.result !== null && p.result > 0)).toBe(true);
  });
  it('samples whole years and rejects fractional ages and illegal option values', () => {
    const calculator = get('egfr'),
      values = example('egfr');
    expect(
      traceCurve(
        calculator,
        values,
        calculator.fields.find((f) => f.id === 'age')!,
      ).points.every((p) => Number.isInteger(p.x)),
    ).toBe(true);
    expect(resultForPose(calculator, { ...values, age: 60.5 })).toBeNull();
    expect(resultForPose(calculator, { ...values, sex: 0.5 })).toBeNull();
  });
  it('expands the view for valid values outside the initial illustrative interval', () => {
    const calculator = get('bmi'),
      field = calculator.fields.find((f) => f.id === 'weight')!;
    expect(inputInterval(calculator, field, 250)).toEqual([40, 250]);
    expect(resultForPose(calculator, { weight: 250, height: 175 })).toBeCloseTo(
      81.63265306122449,
      10,
    );
  });
});

describe('importing main form values into Anatomy', () => {
  it('normalizes mixed FENa units before starting the alternate calculation', () => {
    const calculator = get('fena');
    const imported = importMainValues(
      calculator,
      { ...exampleRaw(calculator), creatinine: '106,08' },
      { creatinine: 1 },
    );
    expect(imported).not.toBeNull();
    expect(evaluateCalculator(calculator, imported!).result).toBeCloseTo(0.17142857142857143, 10);
  });
  it('normalizes fractional oxygen and kPa without changing the result', () => {
    const calculator = get('horovitz');
    const imported = importMainValues(
      calculator,
      { pao2: '10,6657849617765', fio2: '0,4' },
      { pao2: 1, fio2: 1 },
    );
    expect(evaluateCalculator(calculator, imported!).result).toBeCloseTo(200, 8);
  });
  it('does not import incomplete or relationally invalid inputs', () => {
    expect(importMainValues(get('bmi'), { weight: '75' }, {})).toBeNull();
    expect(importMainValues(get('map'), { systolic: '80', diastolic: '120' }, {})).toBeNull();
  });
});
