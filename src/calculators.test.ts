import { describe, expect, it } from 'vitest';
import {
  calculators,
  evaluateCalculator,
  formatNumber,
  parseGermanNumber,
  searchCalculators,
} from './calculators';

const get = (id: string) => calculators.find((calculator) => calculator.id === id)!;
const example = (id: string) =>
  Object.fromEntries(get(id).fields.map((field) => [field.id, field.example]));

// Fixed numerical benchmarks exercise every published formula through the same
// parsing/conversion/validation path used by the UI, rather than its function alone.
describe('reference calculations', () => {
  const benchmarks: [string, number][] = [
    ['bmi', 24.489795918367346],
    ['koerperoberflaeche', 1.9094065395649333],
    ['egfr', 69.23112756748166],
    ['kreatinin-clearance', 69.44444444444444],
    ['fena', 0.17142857142857143],
    ['feurea', 36],
    ['kalzium', 2.3],
    ['natrium', 134.8],
    ['anionenluecke', 12],
    ['anionenluecke-korrigiert', 14.5],
    ['osmolalitaet', 290.54994394556616],
    ['osmotische-luecke', 9.45005605443384],
    ['map', 93.33333333333333],
    ['schockindex', 0.75],
    ['qtc-bazett', 447.21359549995793],
    ['qtc-fridericia', 430.88693800637674],
    ['horovitz', 200],
    ['atemzugvolumen', 423.396],
    ['fib4', 2.02837021134844],
    ['apri', 0.5],
  ];
  it.each(benchmarks)('%s matches its numerical benchmark', (id, expected) => {
    const evaluation = evaluateCalculator(get(id), example(id));
    expect(evaluation.errors).toEqual({});
    expect(evaluation.formError).toBeNull();
    expect(evaluation.result).toBeCloseTo(expected, 8);
  });
  it('uses the female CKD-EPI coefficients', () => {
    expect(evaluateCalculator(get('egfr'), { ...example('egfr'), sex: '0' }).result).toBeCloseTo(
      51.821329905767215,
      8,
    );
  });
  it('uses the low-creatinine branches in both sexes', () => {
    expect(get('egfr').calculate({ age: 60, sex: 1, creatinine: 0.6 })).toBeCloseTo(
      110.51149375323546,
      8,
    );
    expect(get('egfr').calculate({ age: 60, sex: 0, creatinine: 0.5 })).toBeCloseTo(
      107.3063093203978,
      8,
    );
  });
  it('applies the female Cockcroft–Gault adjustment', () => {
    expect(
      evaluateCalculator(get('kreatinin-clearance'), {
        ...example('kreatinin-clearance'),
        sex: '0',
      }).result,
    ).toBeCloseTo(59.02777777777777, 8);
  });
  it('uses female predicted body weight and the 152.4 cm anchor', () => {
    expect(evaluateCalculator(get('atemzugvolumen'), { height: '152,4', sex: '0' }).result).toBe(
      273,
    );
    expect(evaluateCalculator(get('atemzugvolumen'), { height: '152,4', sex: '1' }).result).toBe(
      300,
    );
  });
  it('allows a measured urinary sodium of zero', () => {
    expect(evaluateCalculator(get('fena'), { ...example('fena'), urineSodium: '0' }).result).toBe(
      0,
    );
  });
  it('requires every calculator to cite at least one identifiable medical source', () => {
    for (const calculator of calculators) {
      expect(calculator.sources.length).toBeGreaterThan(0);
      expect(calculator.formula.length).toBeGreaterThan(0);
      for (const source of calculator.sources) {
        expect(new URL(source.url).protocol).toBe('https:');
        expect(source.title.length).toBeGreaterThan(5);
        expect(source.detail.length).toBeGreaterThan(5);
      }
    }
  });
});

describe('laboratory unit conversions', () => {
  it('accepts µmol/l creatinine and matches mg/dl', () => {
    const calculator = get('egfr');
    const standard = evaluateCalculator(calculator, example('egfr')).result;
    expect(
      evaluateCalculator(
        calculator,
        { ...example('egfr'), creatinine: '106,08' },
        { creatinine: 1 },
      ).result,
    ).toBeCloseTo(standard!, 8);
  });
  it('normalizes mixed serum/urine creatinine units before calculating FENa', () => {
    expect(
      evaluateCalculator(
        get('fena'),
        { ...example('fena'), creatinine: '106,08' },
        { creatinine: 1 },
      ).result,
    ).toBeCloseTo(0.17142857142857143, 8);
  });
  it('uses Harnstoff, rather than treating mg/dl Harnstoff as BUN', () => {
    const raw = { ...example('osmolalitaet'), urea: '30,03' };
    expect(evaluateCalculator(get('osmolalitaet'), raw, { urea: 1 }).result).toBeCloseTo(
      290.54994394556616,
      8,
    );
  });
  it('accepts glucose in mmol/l', () => {
    expect(
      evaluateCalculator(
        get('natrium'),
        { sodium: '130', glucose: '22,1997757822646' },
        { glucose: 1 },
      ).result,
    ).toBeCloseTo(134.8, 8);
  });
  it('converts albumin from g/dl to g/l', () => {
    expect(
      evaluateCalculator(get('kalzium'), { calcium: '2,1', albumin: '3' }, { albumin: 1 }).result,
    ).toBeCloseTo(2.3, 8);
  });
  it('accepts fractional FiO₂ and pO₂ in kPa', () => {
    expect(
      evaluateCalculator(
        get('horovitz'),
        { pao2: '10,6657849617765', fio2: '0,4' },
        { pao2: 1, fio2: 1 },
      ).result,
    ).toBeCloseTo(200, 8);
  });
});

describe('input validation and German presentation', () => {
  it.each(['', 'text', 'NaN', 'Infinity', '1e3', '1,2,3', '1.000,2', '0x10'])(
    'rejects ambiguous or invalid input: %s',
    (raw) => {
      expect(parseGermanNumber(raw)).toBeNull();
    },
  );
  it.each([
    ['1,25', 1.25],
    ['1.25', 1.25],
    [' 12 ', 12],
    [',5', 0.5],
    ['-2', -2],
  ] as const)('parses %s', (raw, expected) => {
    expect(parseGermanNumber(raw)).toBe(expected);
  });
  it('does not calculate with incomplete inputs', () => {
    expect(evaluateCalculator(get('bmi'), { weight: '75' }).result).toBeNull();
  });
  it('does not calculate with a zero denominator or negative weight', () => {
    expect(
      evaluateCalculator(get('egfr'), { ...example('egfr'), creatinine: '0' }).result,
    ).toBeNull();
    expect(evaluateCalculator(get('bmi'), { weight: '-5', height: '175' }).result).toBeNull();
  });
  it('rejects an invalid sex parameter', () => {
    expect(evaluateCalculator(get('egfr'), { ...example('egfr'), sex: '2' }).result).toBeNull();
  });
  it('requires an adult, whole-number age', () => {
    expect(evaluateCalculator(get('egfr'), { ...example('egfr'), age: '17' }).result).toBeNull();
    expect(evaluateCalculator(get('egfr'), { ...example('egfr'), age: '60,5' }).result).toBeNull();
  });
  it('restricts oxygen fractions to 21–100%', () => {
    expect(evaluateCalculator(get('horovitz'), { pao2: '80', fio2: '101' }).result).toBeNull();
    expect(
      evaluateCalculator(get('horovitz'), { pao2: '80', fio2: '0,2' }, { fio2: 1 }).result,
    ).toBeNull();
  });
  it('restricts Katz correction to hyperglycemia', () => {
    expect(evaluateCalculator(get('natrium'), { sodium: '130', glucose: '80' }).result).toBeNull();
  });
  it('rejects reversed systolic/diastolic pressures', () => {
    const evaluation = evaluateCalculator(get('map'), { systolic: '80', diastolic: '120' });
    expect(evaluation.formError).toBeTruthy();
    expect(evaluation.result).toBeNull();
  });
  it('keeps negative gaps as valid signed results', () => {
    expect(
      evaluateCalculator(get('anionenluecke'), {
        sodium: '140',
        chloride: '120',
        bicarbonate: '25',
      }).result,
    ).toBe(-5);
    expect(
      evaluateCalculator(get('osmotische-luecke'), {
        ...example('osmotische-luecke'),
        measured: '280',
      }).result,
    ).toBeCloseTo(-10.54994394556616, 8);
  });
  it('formats decimals in German', () => {
    expect(formatNumber(134.8, 1)).toBe('134,8');
  });
});

describe('search', () => {
  it('matches abbreviations, methods, and unaccented German names', () => {
    expect(searchCalculators('egfr').map((c) => c.id)).toContain('egfr');
    expect(searchCalculators('Cockcroft').map((c) => c.id)).toContain('kreatinin-clearance');
    expect(searchCalculators('korperoberflache').map((c) => c.id)).toContain('koerperoberflaeche');
    expect(searchCalculators('qtc').map((c) => c.id)).toEqual(['qtc-bazett', 'qtc-fridericia']);
  });
  it('returns an empty set for unknown queries and all calculators for an empty query', () => {
    expect(searchCalculators('unbekannt')).toEqual([]);
    expect(searchCalculators('')).toHaveLength(20);
  });
});
