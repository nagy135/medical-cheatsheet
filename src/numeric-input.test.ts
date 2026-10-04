import { describe, expect, it } from 'vitest';
import { calculators, evaluateCalculator } from './calculators';
import { stepNumericValue } from './numeric-input';

const get = (id: string) => calculators.find((calculator) => calculator.id === id)!;

describe('numeric input arrows', () => {
  it('changes a German decimal without floating-point artifacts or losing entered precision', () => {
    const field = get('bmi').fields[0];
    expect(stepNumericValue(field, '75,1', 1)).toBe('75,2');
    expect(stepNumericValue(field, '75.15', -1)).toBe('75,05');
  });

  it('adjusts creatinine in the selected laboratory unit', () => {
    const field = get('egfr').fields.find((field) => field.id === 'creatinine')!;
    expect(stepNumericValue(field, '1,2', 1)).toBe('1,21');
    expect(stepNumericValue(field, '106,08', 1, 1)).toBe('107,08');
  });

  it('keeps oxygen fraction adjustments and both limits valid for the calculator', () => {
    const calculator = get('horovitz');
    const field = calculator.fields.find((field) => field.id === 'fio2')!;
    expect(stepNumericValue(field, '0,4', 1, 1)).toBe('0,41');
    expect(stepNumericValue(field, '0,21', -1, 1)).toBe('0,21');
    expect(stepNumericValue(field, '1', 1, 1)).toBe('1');
    expect(
      evaluateCalculator(calculator, { pao2: '80', fio2: '0,41' }, { fio2: 1 }).result,
    ).toBeCloseTo(195.1219512195);
  });

  it('stops at the converted glucose minimum without producing an invalid result', () => {
    const calculator = get('natrium');
    const field = calculator.fields.find((field) => field.id === 'glucose')!;
    const glucose = stepNumericValue(field, '5,65', -1, 1);
    expect(glucose).toBe('5,6');
    expect(
      evaluateCalculator(calculator, { sodium: '130', glucose }, { glucose: 1 }).errors,
    ).toEqual({});
  });

  it('preserves valid zero values and does not invent a value from invalid text', () => {
    const field = get('fena').fields.find((field) => field.id === 'urineSodium')!;
    expect(stepNumericValue(field, '0', -1)).toBe('0');
    expect(stepNumericValue(field, '0', 1)).toBe('1');
    expect(stepNumericValue(field, 'text', 1)).toBe('text');
  });

  it('starts an empty adult-age field at its minimum and respects whole-year limits', () => {
    const field = get('egfr').fields[0];
    expect(stepNumericValue(field, '', 1)).toBe('18');
    expect(stepNumericValue(field, '18', -1)).toBe('18');
    expect(stepNumericValue(field, '120', 1)).toBe('120');
    expect(stepNumericValue(field, '60,5', 1)).toBe('60,5');
  });
});
