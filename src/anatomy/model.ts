import { evaluateCalculator } from '../calculators';
import type { Calculator, Field, Values } from '../calculators';

export type Quantity = { label: string; value: number; unit?: string };
type Spec = {
  axis: string;
  ranges: Record<string, [number, number]>;
  explanation: string;
  steps: (v: Values) => Quantity[];
};
const q = (label: string, value: number, unit?: string): Quantity => ({ label, value, unit });
const osm = (v: Values) => 2 * v.sodium + v.glucose / 18.0182 + v.urea;

// Plotting intervals describe the visible piece of each mathematical function.
// They are not clinical reference intervals or extra validation limits.
export const anatomySpecs: Record<string, Spec> = {
  bmi: {
    axis: 'weight',
    ranges: { weight: [40, 140], height: [140, 210] },
    explanation:
      'Bei gleicher Größe steigt der BMI proportional zum Gewicht. Die Größe steht im Quadrat im Nenner: Eine Verdopplung der Größe würde den BMI auf ein Viertel reduzieren.',
    steps: (v) => [
      q('Größe in Metern', v.height / 100, 'm'),
      q('Größe zum Quadrat', (v.height / 100) ** 2, 'm²'),
      q('Gewicht', v.weight, 'kg'),
    ],
  },
  koerperoberflaeche: {
    axis: 'weight',
    ranges: { weight: [40, 140], height: [140, 210] },
    explanation:
      'Mosteller multipliziert Größe und Gewicht und zieht nach der Skalierung die Quadratwurzel. Vierfaches Gewicht ergibt bei gleicher Größe die doppelte geschätzte Oberfläche.',
    steps: (v) => [
      q('Größe × Gewicht', v.height * v.weight, 'cm × kg'),
      q('Produkt / 3.600', (v.height * v.weight) / 3600),
      q('Zum Ergebnis', Math.sqrt((v.height * v.weight) / 3600), 'm²'),
    ],
  },
  egfr: {
    axis: 'creatinine',
    ranges: { creatinine: [0.2, 4], age: [18, 100] },
    explanation:
      'Die CKD-EPI-Kurve hat bei SCr = κ einen Übergang: Unterhalb wirkt der geschlechtsabhängige Exponent α, oberhalb der Exponent −1,2. Alter und Formelparameter skalieren die gesamte Kurve.',
    steps: (v) => {
      const f = v.sex === 0,
        r = v.creatinine / (f ? 0.7 : 0.9);
      return [
        q('κ', f ? 0.7 : 0.9, 'mg/dl'),
        q('SCr / κ', r),
        q('min(SCr/κ, 1)ᵅ', Math.min(r, 1) ** (f ? -0.241 : -0.302)),
        q('max(SCr/κ, 1)⁻¹·²', Math.max(r, 1) ** -1.2),
        q('Altersfaktor', 0.9938 ** v.age),
        q('Geschlechtsfaktor', f ? 1.012 : 1),
      ];
    },
  },
  'kreatinin-clearance': {
    axis: 'creatinine',
    ranges: { creatinine: [0.3, 4], age: [18, 100], weight: [40, 140] },
    explanation:
      'Cockcroft–Gault teilt einen alters- und gewichtsabhängigen Zähler durch das Kreatinin. Bei sonst gleichen Werten halbiert doppeltes Kreatinin das Ergebnis. Verwendet wird das eingegebene Gewicht.',
    steps: (v) => [
      q('140 − Alter', 140 - v.age, 'Jahre'),
      q('(140 − Alter) × Gewicht', (140 - v.age) * v.weight),
      q('72 × SCr', 72 * v.creatinine),
      q('Geschlechtsfaktor', v.sex === 0 ? 0.85 : 1),
    ],
  },
  fena: {
    axis: 'urineSodium',
    ranges: {
      urineSodium: [0, 150],
      sodium: [115, 160],
      creatinine: [0.3, 5],
      urineCreatinine: [10, 250],
    },
    explanation:
      'Zwei Verhältnisse werden multipliziert: Urin- zu Serumnatrium und Serum- zu Urinkreatinin. Der Faktor 100 schreibt den Anteil als Prozentwert. Die Kreatininwerte müssen in derselben Einheit vorliegen.',
    steps: (v) => [
      q('U-Na / S-Na', v.urineSodium / v.sodium),
      q('S-Cr / U-Cr', v.creatinine / v.urineCreatinine),
      q('Prozentfaktor', 100),
    ],
  },
  feurea: {
    axis: 'urineUrea',
    ranges: {
      urineUrea: [20, 400],
      urea: [2, 30],
      creatinine: [0.3, 5],
      urineCreatinine: [10, 250],
    },
    explanation:
      'Wie bei FENa werden zwei Konzentrationsverhältnisse multipliziert, hier mit Harnstoff. Gleiche Einheiten innerhalb jedes Verhältnisses kürzen sich heraus; × 100 ergibt Prozent.',
    steps: (v) => [
      q('U-Harnstoff / S-Harnstoff', v.urineUrea / v.urea),
      q('S-Cr / U-Cr', v.creatinine / v.urineCreatinine),
      q('Prozentfaktor', 100),
    ],
  },
  kalzium: {
    axis: 'albumin',
    ranges: { albumin: [10, 60], calcium: [1, 3.5] },
    explanation:
      'Die Korrektur addiert 0,02 mmol/l je g/l Albumin unter 40 g/l. Oberhalb von 40 wird die Korrektur negativ. Die Gerade zeigt genau diese konventionelle Rechenregel.',
    steps: (v) => [
      q('40 − Albumin', 40 - v.albumin, 'g/l'),
      q('Korrektur × 0,02', 0.02 * (40 - v.albumin), 'mmol/l'),
      q('Gemessenes Kalzium', v.calcium, 'mmol/l'),
    ],
  },
  natrium: {
    axis: 'glucose',
    ranges: { glucose: [100, 800], sodium: [110, 160] },
    explanation:
      'Bei Katz kommen je 100 mg/dl Glukose oberhalb von 100 mg/dl genau 1,6 mmol/l zum gemessenen Natrium hinzu. Darum ist die Kurve eine Gerade; der Faktor bleibt hier immer 1,6.',
    steps: (v) => [
      q('Glukose − 100', v.glucose - 100, 'mg/dl'),
      q('100-mg/dl-Schritte', (v.glucose - 100) / 100),
      q('Natriumkorrektur', (1.6 * (v.glucose - 100)) / 100, 'mmol/l'),
    ],
  },
  anionenluecke: {
    axis: 'bicarbonate',
    ranges: { sodium: [115, 160], chloride: [80, 125], bicarbonate: [5, 35] },
    explanation:
      'Vom Natrium werden Chlorid und Bikarbonat abgezogen. Erhöht sich einer der beiden Abzüge um 1 mmol/l, sinkt die Lücke um 1 mmol/l. Auch negative Rechenergebnisse bleiben sichtbar.',
    steps: (v) => [
      q('Chlorid + Bikarbonat', v.chloride + v.bicarbonate, 'mmol/l'),
      q('Natrium', v.sodium, 'mmol/l'),
    ],
  },
  'anionenluecke-korrigiert': {
    axis: 'albumin',
    ranges: { sodium: [115, 160], chloride: [80, 125], bicarbonate: [5, 35], albumin: [10, 60] },
    explanation:
      'Zur Lücke ohne Kalium kommt die Albuminkorrektur hinzu: 0,25 mmol/l je g/l unter 40 g/l. Bei Albumin 40 g/l ist sie null; oberhalb wird sie abgezogen.',
    steps: (v) => [
      q('Unkorrigierte Lücke', v.sodium - v.chloride - v.bicarbonate, 'mmol/l'),
      q('40 − Albumin', 40 - v.albumin, 'g/l'),
      q('Albuminkorrektur', 0.25 * (40 - v.albumin), 'mmol/l'),
    ],
  },
  osmolalitaet: {
    axis: 'sodium',
    ranges: { sodium: [115, 160], glucose: [50, 800], urea: [1, 35] },
    explanation:
      'Die SI-Schätzung addiert drei Beiträge: zweimal gemessenes Natrium, Glukose in mmol/l und Harnstoff in mmol/l. Bei gleichen übrigen Werten erhöht 1 mmol/l Natrium die Schätzung um 2 mOsm/kg.',
    steps: (v) => [
      q('2 × Natrium', 2 * v.sodium),
      q('Glukose / 18,0182', v.glucose / 18.0182, 'mmol/l'),
      q('Harnstoff', v.urea, 'mmol/l'),
    ],
  },
  'osmotische-luecke': {
    axis: 'measured',
    ranges: { measured: [240, 380], sodium: [115, 160], glucose: [50, 800], urea: [1, 35] },
    explanation:
      'Die Lücke ist der gemessene Wert minus der SI-Schätzung. Bei Gleichheit ist sie null; liegt der gemessene Wert darunter, wird sie negativ. Ethanol wird in dieser Formel nicht berücksichtigt.',
    steps: (v) => [
      q('2 × Na + Glukose + Harnstoff', osm(v), 'mOsm/kg'),
      q('Gemessene Osmolalität', v.measured, 'mOsm/kg'),
    ],
  },
  map: {
    axis: 'diastolic',
    ranges: { systolic: [60, 220], diastolic: [30, 140] },
    explanation:
      'Der geschätzte Mitteldruck liegt ein Drittel des Pulsdrucks über dem diastolischen Wert. +30 mmHg systolisch erhöhen ihn um 10, +30 mmHg diastolisch um 20. Die Kurve endet, sobald diastolisch > systolisch wäre.',
    steps: (v) => [
      q('Pulsdruck S − D', v.systolic - v.diastolic, 'mmHg'),
      q('Ein Drittel des Pulsdrucks', (v.systolic - v.diastolic) / 3, 'mmHg'),
      q('Diastolischer Sockel', v.diastolic, 'mmHg'),
    ],
  },
  schockindex: {
    axis: 'heartRate',
    ranges: { heartRate: [40, 160], systolic: [60, 200] },
    explanation:
      'Der Schockindex ist ein Quotient: Bei gleichem systolischem Druck verdoppelt doppelte Herzfrequenz den Index. Bei gleicher Herzfrequenz halbiert doppelter Druck den Index.',
    steps: (v) => [
      q('Zähler: Herzfrequenz', v.heartRate, '/min'),
      q('Nenner: systolischer Druck', v.systolic, 'mmHg'),
    ],
  },
  'qtc-bazett': {
    axis: 'heartRate',
    ranges: { heartRate: [40, 160], qt: [250, 600] },
    explanation:
      'Zuerst wird die Herzfrequenz in RR-Sekunden umgerechnet. Bazett teilt das gemessene QT durch √RR. Bei 60/min ist RR = 1 s und der Zahlenwert von QTc gleich QT.',
    steps: (v) => [
      q('RR = 60 / Herzfrequenz', 60 / v.heartRate, 's'),
      q('√RR', Math.sqrt(60 / v.heartRate), 's½'),
      q('Gemessenes QT', v.qt, 'ms'),
    ],
  },
  'qtc-fridericia': {
    axis: 'heartRate',
    ranges: { heartRate: [40, 160], qt: [250, 600] },
    explanation:
      'Fridericia teilt QT durch die Kubikwurzel von RR statt durch die Quadratwurzel. Bei 60/min ist der Korrekturfaktor 1. Die andere Wurzel verändert die Frequenzabhängigkeit der Kurve.',
    steps: (v) => [
      q('RR = 60 / Herzfrequenz', 60 / v.heartRate, 's'),
      q('∛RR', Math.cbrt(60 / v.heartRate), 's⅓'),
      q('Gemessenes QT', v.qt, 'ms'),
    ],
  },
  horovitz: {
    axis: 'fio2',
    ranges: { fio2: [21, 100], pao2: [40, 200] },
    explanation:
      'Der Sauerstoffanteil wird vor dem Dividieren von Prozent in einen Anteil umgerechnet: 40 % = 0,40. Bei gleichem PaO₂ halbiert ein doppelter FiO₂-Anteil den P/F-Wert.',
    steps: (v) => [q('FiO₂ / 100', v.fio2 / 100, 'Anteil'), q('PaO₂', v.pao2, 'mmHg')],
  },
  atemzugvolumen: {
    axis: 'height',
    ranges: { height: [140, 210] },
    explanation:
      'Aus Größe und Formelparameter entsteht zuerst das vorhergesagte Körpergewicht (PBW). Jeder weitere Zentimeter erhöht PBW um 0,91 kg und den Rechenwert bei 6 ml/kg um 5,46 ml.',
    steps: (v) => [
      q('Größe − 152,4', v.height - 152.4, 'cm'),
      q('PBW-Sockel', v.sex === 1 ? 50 : 45.5, 'kg'),
      q('Vorhergesagtes Gewicht', (v.sex === 1 ? 50 : 45.5) + 0.91 * (v.height - 152.4), 'kg'),
      q('Volumen je kg PBW', 6, 'ml/kg'),
    ],
  },
  fib4: {
    axis: 'platelets',
    ranges: { age: [18, 100], ast: [10, 250], platelets: [30, 400], alt: [10, 250] },
    explanation:
      'Alter und AST stehen im Zähler; Thrombozyten und √ALT im Nenner. Doppelte Thrombozyten halbieren bei sonst gleichen Werten den Index; vierfache ALT halbiert ihn ebenfalls.',
    steps: (v) => [
      q('Alter × AST', v.age * v.ast),
      q('√ALT', Math.sqrt(v.alt)),
      q('Thrombozyten × √ALT', v.platelets * Math.sqrt(v.alt)),
    ],
  },
  apri: {
    axis: 'ast',
    ranges: { ast: [10, 250], platelets: [30, 400], astLimit: [20, 60] },
    explanation:
      'AST wird zuerst an der oberen Normgrenze des Labors gemessen. Dieses Verhältnis wird durch die Thrombozyten geteilt und mit 100 multipliziert. Die Normgrenze ist deshalb ein eigener Eingabewert.',
    steps: (v) => [
      q('AST / AST-Normgrenze', v.ast / v.astLimit),
      q('Thrombozyten', v.platelets, 'G/l'),
      q('Skalierungsfaktor', 100),
    ],
  },
};

export function exampleRaw(calculator: Calculator) {
  return Object.fromEntries(calculator.fields.map((f) => [f.id, f.example]));
}

export function canonicalRaw(values: Values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      String(Number(value.toPrecision(12))).replace('.', ','),
    ]),
  );
}

export function inputInterval(
  calculator: Calculator,
  field: Field,
  value?: number,
): [number, number] {
  const range = anatomySpecs[calculator.id].ranges[field.id];
  if (!range) throw new Error(`Missing Anatomy scale: ${calculator.id}/${field.id}`);
  const min = Math.max(field.min ?? -Infinity, Math.min(range[0], value ?? range[0]));
  const max = Math.min(field.max ?? Infinity, Math.max(range[1], value ?? range[1]));
  return [min, max];
}

export function resultForPose(calculator: Calculator, values: Values) {
  for (const field of calculator.fields) {
    const v = values[field.id];
    if (
      !Number.isFinite(v) ||
      (field.min !== undefined && v < field.min) ||
      (field.max !== undefined && v > field.max) ||
      (field.integer && !Number.isInteger(v)) ||
      (field.options && !field.options.some((o) => Number(o.value) === v))
    )
      return null;
  }
  if (calculator.validate?.(values)) return null;
  const result = calculator.calculate(values);
  return Number.isFinite(result) ? result : null;
}

export type Curve = {
  points: { x: number; result: number | null }[];
  x: [number, number];
  y: [number, number];
};

export function traceCurve(calculator: Calculator, values: Values, axis: Field): Curve {
  const x = inputInterval(calculator, axis, values[axis.id]);
  const inputs = Array.from({ length: 81 }, (_, i) => {
    const candidate = x[0] + ((x[1] - x[0]) * i) / 80;
    return axis.integer ? Math.round(candidate) : candidate;
  });
  inputs.push(values[axis.id]);
  if (calculator.id === 'map')
    inputs.push(axis.id === 'diastolic' ? values.systolic : values.diastolic);
  if (calculator.id === 'egfr' && axis.id === 'creatinine')
    inputs.push(values.sex === 0 ? 0.7 : 0.9);
  const points = [...new Set(inputs)]
    .filter((input) => input >= x[0] && input <= x[1])
    .sort((a, b) => a - b)
    .map((input) => ({
      x: input,
      result: resultForPose(calculator, { ...values, [axis.id]: input }),
    }));
  const results = points.flatMap((p) => (p.result === null ? [] : [p.result]));
  const atInput = resultForPose(calculator, values);
  if (atInput !== null) results.push(atInput);
  const lo = results.length ? Math.min(...results) : 0;
  const hi = results.length ? Math.max(...results) : 1;
  const pad = Math.max((hi - lo) * 0.08, Math.abs(hi) * 0.01, 0.01);
  return { points, x, y: [lo - pad, hi + pad] };
}

export function importMainValues(
  calculator: Calculator,
  raw: Record<string, string>,
  units: Record<string, number>,
) {
  const evaluation = evaluateCalculator(calculator, raw, units);
  return evaluation.result === null ? null : canonicalRaw(evaluation.values);
}
