export const categories = [
  { id: 'allgemein', name: 'Allgemeinmedizin', short: 'Allgemein', icon: 'body', color: 'sage' },
  { id: 'niere', name: 'Nephrologie', short: 'Nephrologie', icon: 'kidney', color: 'blue' },
  {
    id: 'elektrolyte',
    name: 'Elektrolyte & Stoffwechsel',
    short: 'Elektrolyte',
    icon: 'flask',
    color: 'amber',
  },
  { id: 'herz', name: 'Kardiologie', short: 'Kardiologie', icon: 'heart', color: 'rose' },
  {
    id: 'intensiv',
    name: 'Intensivmedizin',
    short: 'Intensivmedizin',
    icon: 'lungs',
    color: 'violet',
  },
  { id: 'leber', name: 'Hepatologie', short: 'Hepatologie', icon: 'liver', color: 'sand' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];
export type Values = Record<string, number>;
export type Source = { title: string; detail: string; url: string };
export type Unit = { label: string; factor: number; step?: number };
export type Field = {
  id: string;
  label: string;
  unit?: string;
  units?: Unit[];
  min?: number;
  max?: number;
  integer?: boolean;
  step?: number;
  example: string;
  hint?: string;
  options?: { label: string; value: string }[];
};
export type Calculator = {
  id: string;
  title: string;
  abbreviation: string;
  category: CategoryId;
  description: string;
  method: string;
  fields: Field[];
  calculate: (v: Values) => number;
  resultLabel: string;
  resultUnit: string;
  precision: number;
  // Undefined uses the generic plotter; custom figures are routed in App.
  anatomy?: false | 'custom';
  formula: string;
  formulaDetail?: string;
  note: string;
  sources: Source[];
  keywords: string[];
  interpret?: (result: number, values: Values) => string;
  validate?: (v: Values) => string | null;
};

const source = (title: string, detail: string, url: string): Source => ({ title, detail, url });
const number = (
  id: string,
  label: string,
  unit: string,
  example: string,
  extra: Partial<Field> = {},
): Field => ({ id, label, unit, example, min: 0.000001, ...extra });
const age = (): Field =>
  number('age', 'Alter', 'Jahre', '60', { min: 18, max: 120, integer: true });
const height = (): Field => number('height', 'Körpergröße', 'cm', '175', { min: 100, max: 250 });
const weight = (): Field => number('weight', 'Körpergewicht', 'kg', '75', { max: 500, step: 0.1 });
const sex = (): Field => ({
  id: 'sex',
  label: 'Geschlecht (Formelparameter)',
  example: '1',
  options: [
    { label: 'Männlich', value: '1' },
    { label: 'Weiblich', value: '0' },
  ],
});
const creatinineUnits = [
  { label: 'mg/dl', factor: 1, step: 0.01 },
  { label: 'µmol/l', factor: 1 / 88.4, step: 1 },
];
const glucoseUnits = [
  { label: 'mg/dl', factor: 1, step: 1 },
  { label: 'mmol/l', factor: 18.0182, step: 0.1 },
];
const ureaUnits = [
  { label: 'mmol/l', factor: 1, step: 0.1 },
  { label: 'mg/dl', factor: 1 / 6.006, step: 1 },
];
const albumin = (): Field =>
  number('albumin', 'Albumin', 'g/l', '30', {
    units: [
      { label: 'g/l', factor: 1, step: 1 },
      { label: 'g/dl', factor: 10, step: 0.1 },
    ],
    max: 100,
  });
const creatinine = (id = 'creatinine', label = 'Serumkreatinin', example = '1,2'): Field =>
  number(id, label, 'mg/dl', example, { units: creatinineUnits });
const sodium = (id = 'sodium', label = 'Serumnatrium', example = '140'): Field =>
  number(id, label, 'mmol/l', example);
const glucose = (): Field => number('glucose', 'Glukose', 'mg/dl', '100', { units: glucoseUnits });
const urea = (id = 'urea', label = 'Serumharnstoff', example = '5'): Field =>
  number(id, label, 'mmol/l', example, {
    units: ureaUnits,
    hint: 'Harnstoff, nicht Harnstoff-Stickstoff (BUN).',
  });
const anionFields = (): Field[] => [
  sodium(),
  number('chloride', 'Chlorid', 'mmol/l', '104'),
  number('bicarbonate', 'Bikarbonat (HCO₃⁻)', 'mmol/l', '24'),
];
const qtFields = (): Field[] => [
  number('qt', 'QT-Intervall', 'ms', '400', { max: 1500 }),
  number('heartRate', 'Herzfrequenz', '/min', '75', { max: 350 }),
];
const liverFields = (): Field[] => [
  number('ast', 'AST (GOT)', 'U/l', '40'),
  number('platelets', 'Thrombozyten', 'G/l', '200', {
    hint: 'G/l entspricht 10⁹/l bzw. 1.000/µl.',
  }),
];
const anionSource = source(
  'MSD Manual · Säure-Basen-Störungen',
  'Professionelle Referenz · Anionenlücke ohne Kalium',
  'https://www.msdmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/acid-base-disorders',
);
const osmSource = source(
  'NHS · Osmolality',
  'Gloucestershire Hospitals · SI-Formel und osmolale Lücke',
  'https://www.gloshospitals.nhs.uk/our-services/services-we-offer/pathology/tests-and-investigations/osmolality/',
);
const qtSource = source(
  'AHA / ACCF / HRS · Elektrokardiogramm',
  'Rautaharju et al., Circulation 2009 · QT-Intervall und Frequenzkorrektur',
  'https://doi.org/10.1161/CIRCULATIONAHA.108.191096',
);
const qtFormulaSource = source(
  'ACEP · QTc: So Many Formulae, But Which One to Use?',
  'American College of Emergency Physicians · Formeln und Frequenzabhängigkeit',
  'https://www.acep.org/toxicology/newsroom/feb2021/qtc-so-many-formulae-but-which-one-to-use',
);
const ardsSource = source(
  'NHLBI · ARDS Network ALTA Protocol',
  'Originales Studienprotokoll · Beatmung nach vorhergesagtem Körpergewicht',
  'https://biolincc.nhlbi.nih.gov/media/studies/alta/Protocol.pdf',
);

// One registry drives search, cards, forms, results, and source panels.
// Calculations receive canonical units; unit conversions happen before evaluation.
export const calculators: Calculator[] = [
  {
    id: 'bmi',
    title: 'Body-Mass-Index',
    abbreviation: 'BMI',
    category: 'allgemein',
    description: 'Körpergewicht im Verhältnis zur Körpergröße einordnen.',
    method: 'WHO-Klassifikation für Erwachsene',
    fields: [weight(), height()],
    calculate: (v) => v.weight / (v.height / 100) ** 2,
    resultLabel: 'Body-Mass-Index',
    resultUnit: 'kg/m²',
    precision: 1,
    formula: 'BMI = Gewicht / Größe²',
    formulaDetail: 'Gewicht in kg, Körpergröße in m.',
    interpret: (r) =>
      r < 18.5 ? 'Untergewicht' : r < 25 ? 'Normalgewicht' : r < 30 ? 'Übergewicht' : 'Adipositas',
    note: 'Für Erwachsene. Bei Schwangerschaft, Ödemen oder ausgeprägter Muskelmasse ist die Aussagekraft eingeschränkt.',
    sources: [
      source(
        'WHO · Body mass index',
        'Definition und Gewichtsklassifikation für Erwachsene',
        'https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women',
      ),
    ],
    keywords: ['gewicht', 'adipositas', 'body mass index'],
  },
  {
    id: 'koerperoberflaeche',
    title: 'Körperoberfläche',
    abbreviation: 'KOF',
    category: 'allgemein',
    description: 'Körperoberfläche nach der Mosteller-Formel berechnen.',
    method: 'Mosteller · 1987',
    fields: [weight(), height()],
    calculate: (v) => Math.sqrt((v.height * v.weight) / 3600),
    resultLabel: 'Körperoberfläche',
    resultUnit: 'm²',
    precision: 2,
    formula: 'KOF = √(Größe × Gewicht / 3.600)',
    formulaDetail: 'Körpergröße in cm, Gewicht in kg.',
    note: 'Schätzung der Körperoberfläche. Eine Medikamentendosis ergibt sich daraus nicht automatisch.',
    sources: [
      source(
        'Mosteller · Simplified calculation of body-surface area',
        'N Engl J Med 1987;317:1098 · DOI: 10.1056/NEJM198710223171717',
        'https://pubmed.ncbi.nlm.nih.gov/3657876/',
      ),
    ],
    keywords: ['bsa', 'mosteller', 'oberfläche'],
  },
  {
    id: 'egfr',
    title: 'Glomeruläre Filtrationsrate',
    abbreviation: 'eGFR',
    category: 'niere',
    description: 'Nierenfunktion aus Kreatinin, Alter und Geschlecht schätzen.',
    method: 'CKD-EPI · Kreatinin 2021',
    fields: [age(), sex(), creatinine()],
    calculate: (v) => {
      const female = v.sex === 0;
      const ratio = v.creatinine / (female ? 0.7 : 0.9);
      return (
        142 *
        Math.min(ratio, 1) ** (female ? -0.241 : -0.302) *
        Math.max(ratio, 1) ** -1.2 *
        0.9938 ** v.age *
        (female ? 1.012 : 1)
      );
    },
    resultLabel: 'Geschätzte GFR',
    resultUnit: 'ml/min/1,73 m²',
    precision: 1,
    formula: '142 × min(SCr/κ, 1)ᵅ × max(SCr/κ, 1)⁻¹·² × 0,9938ᴬˡᵗᵉʳ × F',
    formulaDetail:
      'SCr in mg/dl; κ = 0,7 / 0,9, α = −0,241 / −0,302 und F = 1,012 / 1 für weiblich / männlich. µmol/l ÷ 88,4 = mg/dl.',
    note: 'Für Erwachsene mit stabilem, IDMS-standardisiertem Kreatinin. Bei akut veränderter Nierenfunktion nicht zuverlässig. Normiert auf 1,73 m²; kein Nachweis einer chronischen Nierenerkrankung aus einem Einzelwert.',
    sources: [
      source(
        'National Kidney Foundation · CKD-EPI 2021',
        'Exakte Gleichung, Konstanten und Einheiten',
        'https://www.kidney.org/ckd-epi-creatinine-equation-2021',
      ),
      source(
        'Inker et al. · New Creatinine and Cystatin C Equations',
        'N Engl J Med 2021;385:1737–1749 · Originalpublikation',
        'https://doi.org/10.1056/NEJMoa2102953',
      ),
    ],
    keywords: ['gfr', 'ckd epi', 'kreatinin', 'nierenfunktion'],
  },
  {
    id: 'kreatinin-clearance',
    title: 'Kreatinin-Clearance',
    abbreviation: 'CrCl',
    category: 'niere',
    description: 'Kreatinin-Clearance nach Cockcroft und Gault schätzen.',
    method: 'Cockcroft–Gault · 1976',
    fields: [age(), sex(), weight(), creatinine()],
    calculate: (v) => (((140 - v.age) * v.weight) / (72 * v.creatinine)) * (v.sex === 0 ? 0.85 : 1),
    resultLabel: 'Geschätzte Kreatinin-Clearance',
    resultUnit: 'ml/min',
    precision: 1,
    formula: 'CrCl = (140 − Alter) × Gewicht / (72 × SCr) × F',
    formulaDetail: 'Gewicht in kg, SCr in mg/dl. F = 0,85 für weiblich, sonst 1.',
    note: 'Für Erwachsene mit stabilem Kreatinin. Verwendet das eingegebene Gewicht ohne Anpassung; die Wahl des Gewichts ist insbesondere bei Adipositas klinisch zu prüfen. Nicht mit der normierten eGFR gleichsetzen.',
    sources: [
      source(
        'Cockcroft & Gault · Prediction of Creatinine Clearance',
        'Nephron 1976;16:31–41 · Originalpublikation',
        'https://doi.org/10.1159/000180580',
      ),
      source(
        'National Kidney Foundation · Cockcroft–Gault',
        'Aktuelle Einordnung und Einschränkungen des Verfahrens',
        'https://www.kidney.org/professionals/kdoqi/cockcroft-gault-equation-estimating-creatinine-clearance',
      ),
    ],
    keywords: ['cockcroft', 'gault', 'crcl', 'niere'],
  },
  {
    id: 'fena',
    title: 'Fraktionelle Natriumexkretion',
    abbreviation: 'FENa',
    category: 'niere',
    description: 'Anteil des filtrierten Natriums im Urin berechnen.',
    method: 'Fraktionelle Exkretion',
    fields: [
      sodium(),
      { ...sodium('urineSodium', 'Urinnatrium', '20'), min: 0 },
      creatinine(),
      creatinine('urineCreatinine', 'Urinkreatinin', '100'),
    ],
    calculate: (v) => (100 * v.urineSodium * v.creatinine) / (v.sodium * v.urineCreatinine),
    resultLabel: 'Fraktionelle Natriumexkretion',
    resultUnit: '%',
    precision: 2,
    formula: 'FENa = (U-Na × S-Cr) / (S-Na × U-Cr) × 100',
    note: 'Serum- und Urinprobe zeitnah entnehmen. Diuretika und chronische Nierenerkrankungen können die Interpretation verändern; keine isolierte Ursachenbestimmung einer akuten Nierenschädigung.',
    sources: [
      source(
        'Espinel · The FENa test',
        'JAMA 1976;236:579–581 · Originalpublikation',
        'https://pubmed.ncbi.nlm.nih.gov/947239/',
      ),
    ],
    keywords: ['fena', 'natrium', 'exkretion', 'urin'],
  },
  {
    id: 'feurea',
    title: 'Fraktionelle Harnstoffexkretion',
    abbreviation: 'FEUrea',
    category: 'niere',
    description: 'Anteil des filtrierten Harnstoffs im Urin berechnen.',
    method: 'Carvounis et al. · 2002',
    fields: [
      urea(),
      urea('urineUrea', 'Urinharnstoff', '150'),
      creatinine(),
      creatinine('urineCreatinine', 'Urinkreatinin', '100'),
    ],
    calculate: (v) => (100 * v.urineUrea * v.creatinine) / (v.urea * v.urineCreatinine),
    resultLabel: 'Fraktionelle Harnstoffexkretion',
    resultUnit: '%',
    precision: 1,
    formula: 'FEUrea = (U-Harnstoff × S-Cr) / (S-Harnstoff × U-Cr) × 100',
    note: 'Zeitnahe Serum- und Urinproben verwenden. Die Formel setzt konsistente Harnstoffeinheiten voraus. Auch unter Diuretika ist eine klinische Einordnung erforderlich.',
    sources: [
      source(
        'Carvounis et al. · Fractional excretion of urea',
        'Kidney Int 2002;62:2223–2229 · Originalpublikation',
        'https://pubmed.ncbi.nlm.nih.gov/12427149/',
      ),
    ],
    keywords: ['feurea', 'harnstoff', 'urin'],
  },
  {
    id: 'kalzium',
    title: 'Albuminkorrigiertes Kalzium',
    abbreviation: 'Ca korr.',
    category: 'elektrolyte',
    description: 'Gesamtkalzium für die Albuminkonzentration korrigieren.',
    method: 'Konventionelle Albuminkorrektur · Faktor 0,02',
    fields: [number('calcium', 'Gesamtkalzium', 'mmol/l', '2,1', { step: 0.01 }), albumin()],
    calculate: (v) => v.calcium + 0.02 * (40 - v.albumin),
    resultLabel: 'Korrigiertes Gesamtkalzium',
    resultUnit: 'mmol/l',
    precision: 2,
    formula: 'Ca korr. = Ca gemessen + 0,02 × (40 − Albumin)',
    formulaDetail: 'Kalzium in mmol/l, Albumin in g/l. Albumin-Referenz: 40 g/l.',
    note: 'Die Albuminkorrektur kann den Kalziumstatus falsch einordnen, besonders bei kritischer Erkrankung oder Niereninsuffizienz. Bei klinischer Relevanz ionisiertes Kalzium direkt messen.',
    sources: [
      source(
        'MSD Manual · Hypokalzämie',
        'Albumineffekt: 0,2 mmol/l Kalzium je 1 g/dl Albumin',
        'https://www.msdmanuals.com/de/profi/endokrine-und-metabolische-krankheiten/elektrolytst%C3%B6rungen/hypokalz%C3%A4mie',
      ),
      source(
        'Desgagnés et al. · Albumin-Adjusted Calcium Measurements',
        'JAMA Netw Open 2025 · Genauigkeit und Grenzen der Albuminkorrektur',
        'https://pubmed.ncbi.nlm.nih.gov/39836424/',
      ),
    ],
    keywords: ['calcium', 'calzium', 'kalzium', 'albumin'],
  },
  {
    id: 'natrium',
    title: 'Glukosekorrigiertes Natrium',
    abbreviation: 'Na korr.',
    category: 'elektrolyte',
    description: 'Natrium bei Hyperglykämie nach Katz korrigieren.',
    method: 'Katz · 1973 · Faktor 1,6',
    fields: [
      sodium('sodium', 'Gemessenes Natrium', '130'),
      {
        ...glucose(),
        example: '400',
        min: 100,
        hint: 'Für Hyperglykämie ab 100 mg/dl (≈ 5,55 mmol/l).',
      },
    ],
    calculate: (v) => v.sodium + (1.6 * (v.glucose - 100)) / 100,
    resultLabel: 'Korrigiertes Natrium',
    resultUnit: 'mmol/l',
    precision: 1,
    formula: 'Na korr. = Na gemessen + 1,6 × (Glukose − 100) / 100',
    formulaDetail: 'Natrium in mmol/l, Glukose in mg/dl. mmol/l Glukose × 18,0182 = mg/dl.',
    note: 'Katz-Korrekturfaktor 1,6; andere Verfahren verwenden andere Faktoren. Die Schätzung ist besonders bei ausgeprägter Hyperglykämie eingeschränkt.',
    sources: [
      source(
        'Katz · Hyperglycemia-induced hyponatremia',
        'N Engl J Med 1973;289:843–844 · Originalpublikation',
        'https://pubmed.ncbi.nlm.nih.gov/4763428/',
      ),
      source(
        'MSD Manual · Akute Diabeteskomplikationen',
        'Bestätigung der Korrektur um 1,6 mmol/l je 100 mg/dl',
        'https://www.msdmanuals.com/professional/endocrine-and-metabolic-disorders/diabetes-mellitus-and-hypoglycemia/acute-complications-of-diabetes-mellitus',
      ),
    ],
    keywords: ['natrium', 'hyperglykämie', 'katz', 'na', 'zucker'],
  },
  {
    id: 'wasserdefizit',
    title: 'Freies Wasserdefizit',
    abbreviation: 'Wasserdefizit',
    category: 'elektrolyte',
    description:
      'Freies Wasserdefizit bei Hypernatriämie bis zum Referenznatrium 140 mmol/l schätzen.',
    method: 'Gesamtkörperwasser × (Na / 140 − 1) · Erwachsene',
    anatomy: 'custom',
    fields: [
      { ...weight(), example: '70' },
      { ...sodium('sodium', 'Aktuelles Serumnatrium', '170'), min: 140 },
      number('bodyWaterFraction', 'Geschätzter Körperwasserfaktor', 'l/kg', '0,6', {
        max: 1,
        step: 0.05,
        hint: 'Häufig 0,6 für Männer und 0,5 für Frauen; bei älteren oder dehydrierten Erwachsenen ggf. niedriger. Individuell einschätzen.',
      }),
    ],
    calculate: (v) => v.weight * v.bodyWaterFraction * (v.sodium / 140 - 1),
    resultLabel: 'Geschätztes freies Wasserdefizit bis Na 140 mmol/l',
    resultUnit: 'l',
    precision: 2,
    formula: 'Wasserdefizit = Gewicht × Körperwasserfaktor × (Na / 140 − 1)',
    formulaDetail:
      'Gewicht in kg, Körperwasserfaktor in l/kg, Natrium in mmol/l. Gewicht × Faktor schätzt das aktuelle Gesamtkörperwasser in Litern. 140 mmol/l ist der Rechenbezug, kein kurzfristiges Korrekturziel.',
    note: 'Für Erwachsene. Geschätztes freies Wasserdefizit, kein Infusionsvolumen oder Dosierungsplan. Laufende Verluste und Erhaltungsbedarf sind nicht enthalten. Volumenstatus, Ursache und Dauer berücksichtigen. Schwere Hypernatriämie erfordert überwachte Behandlung mit wiederholten Natriumkontrollen; eine zu schnelle Korrektur vermeiden.',
    sources: [
      source(
        'MSD Manual · Hypernatriämie',
        'Professionelle Referenz · Schätzung des Wasserdefizits, Körperwasserfaktoren und Grenzen',
        'https://www.msdmanuals.com/professional/nephrology/electrolyte-disorders/hypernatremia',
      ),
      source(
        'Yun et al. · Hypernatremia in adults',
        'Korean J Intern Med 2023 · Wasserdefizitformel, TBW-Schätzung und laufende Verluste',
        'https://doi.org/10.3904/kjim.2022.346',
      ),
    ],
    keywords: [
      'hypernatriämie',
      'hypernatraemie',
      'hypernatremia',
      'free water deficit',
      'flüssigkeit',
      'fluessigkeit',
      'dehydratation',
      'tbw',
      'wasser',
      'natrium',
    ],
  },
  {
    id: 'anionenluecke',
    title: 'Anionenlücke',
    abbreviation: 'AG',
    category: 'elektrolyte',
    description: 'Anionenlücke aus Natrium, Chlorid und Bikarbonat.',
    method: 'Berechnung ohne Kalium',
    fields: anionFields(),
    calculate: (v) => v.sodium - v.chloride - v.bicarbonate,
    resultLabel: 'Anionenlücke',
    resultUnit: 'mmol/l',
    precision: 1,
    formula: 'AG = Na⁺ − (Cl⁻ + HCO₃⁻)',
    note: 'Ohne Kalium und ohne Albuminkorrektur. Der Referenzbereich hängt vom Labor ab; Hypoalbuminämie kann eine erhöhte Anionenlücke maskieren.',
    sources: [anionSource],
    keywords: ['anion gap', 'azidose', 'bga'],
  },
  {
    id: 'anionenluecke-korrigiert',
    title: 'Albuminkorrigierte Anionenlücke',
    abbreviation: 'AG korr.',
    category: 'elektrolyte',
    description: 'Anionenlücke unter Berücksichtigung des Albumins.',
    method: 'Figge et al. · 1998 · Referenz 40 g/l',
    fields: [...anionFields(), albumin()],
    calculate: (v) => v.sodium - v.chloride - v.bicarbonate + 0.25 * (40 - v.albumin),
    resultLabel: 'Korrigierte Anionenlücke',
    resultUnit: 'mmol/l',
    precision: 1,
    formula: 'AG korr. = Na − Cl − HCO₃ + 0,25 × (40 − Albumin)',
    formulaDetail: 'Elektrolyte in mmol/l, Albumin in g/l. Gewählte Albumin-Referenz: 40 g/l.',
    note: 'Ohne Kalium. Die Korrektur ersetzt weder die Blutgasanalyse noch eine direkte Laktatmessung. Referenzbereiche des Labors berücksichtigen.',
    sources: [
      anionSource,
      source(
        'Figge et al. · Anion gap and hypoalbuminemia',
        'Crit Care Med 1998;26:1807–1810 · Korrekturfaktor 0,25 pro g/l',
        'https://pubmed.ncbi.nlm.nih.gov/9824071/',
      ),
    ],
    keywords: ['anion gap', 'albumin', 'figge'],
  },
  {
    id: 'osmolalitaet',
    title: 'Serumosmolalität',
    abbreviation: 'Osm',
    category: 'elektrolyte',
    description: 'Osmolalität aus Natrium, Glukose und Harnstoff schätzen.',
    method: 'Vereinfachte SI-Formel',
    fields: [sodium(), glucose(), urea()],
    calculate: (v) => 2 * v.sodium + v.glucose / 18.0182 + v.urea,
    resultLabel: 'Geschätzte Serumosmolalität',
    resultUnit: 'mOsm/kg',
    precision: 1,
    formula: 'Osm ≈ 2 × Na + Glukose + Harnstoff',
    formulaDetail:
      'Alle Konzentrationen in mmol/l. mg/dl Glukose ÷ 18,0182; mg/dl Harnstoff ÷ 6,006.',
    note: 'Näherung der Osmolalität aus berechneter Osmolarität. Verwendet gemessenes Natrium; Ethanol und andere Osmole sind nicht enthalten.',
    sources: [osmSource],
    keywords: ['osmolarität', 'osmolalität', 'osm'],
  },
  {
    id: 'osmotische-luecke',
    title: 'Osmolale Lücke',
    abbreviation: 'Osm-Gap',
    category: 'elektrolyte',
    description: 'Gemessene und berechnete Osmolalität vergleichen.',
    method: 'Gemessener Wert minus SI-Schätzung',
    fields: [
      number('measured', 'Gemessene Osmolalität', 'mOsm/kg', '300'),
      sodium(),
      glucose(),
      urea(),
    ],
    calculate: (v) => v.measured - (2 * v.sodium + v.glucose / 18.0182 + v.urea),
    resultLabel: 'Osmolale Lücke',
    resultUnit: 'mOsm/kg',
    precision: 1,
    formula: 'Osm-Gap = Osm gemessen − (2 × Na + Glukose + Harnstoff)',
    formulaDetail: 'Konzentrationen in mmol/l. Keine Ethanolkorrektur.',
    note: 'Ethanol ist nicht eingerechnet und erhöht die Lücke. Labor- und formelabhängig; ein normaler Wert schließt eine Intoxikation nicht aus.',
    sources: [osmSource],
    keywords: ['osmotische lücke', 'osmolal gap', 'intoxikation'],
  },
  {
    id: 'map',
    title: 'Mittlerer arterieller Druck',
    abbreviation: 'MAD',
    category: 'herz',
    description: 'Mittleren arteriellen Druck aus dem Blutdruck schätzen.',
    method: 'Diastolischer Druck + ⅓ Pulsdruck',
    fields: [
      number('systolic', 'Systolischer Blutdruck', 'mmHg', '120'),
      number('diastolic', 'Diastolischer Blutdruck', 'mmHg', '80'),
    ],
    calculate: (v) => (v.systolic + 2 * v.diastolic) / 3,
    validate: (v) =>
      v.diastolic > v.systolic
        ? 'Der systolische Blutdruck muss mindestens so hoch wie der diastolische sein.'
        : null,
    resultLabel: 'Mittlerer arterieller Druck',
    resultUnit: 'mmHg',
    precision: 1,
    formula: 'MAD ≈ (RR systolisch + 2 × RR diastolisch) / 3',
    note: 'Näherungsformel bei üblicher Herzfrequenz. Bei Tachykardie, Arrhythmien oder stark veränderter Pulsform kann sie vom gemessenen Mitteldruck abweichen.',
    sources: [
      source(
        'NCBI Bookshelf · Physiology, Mean Arterial Pressure',
        'StatPearls · Formel und physiologische Grundlagen',
        'https://www.ncbi.nlm.nih.gov/books/NBK538226/',
      ),
    ],
    keywords: ['map', 'mad', 'blutdruck', 'rr'],
  },
  {
    id: 'schockindex',
    title: 'Schockindex',
    abbreviation: 'SI',
    category: 'herz',
    description: 'Herzfrequenz und systolischen Blutdruck ins Verhältnis setzen.',
    method: 'Allgöwer-Schockindex',
    fields: [
      number('heartRate', 'Herzfrequenz', '/min', '90'),
      number('systolic', 'Systolischer Blutdruck', 'mmHg', '120'),
    ],
    calculate: (v) => v.heartRate / v.systolic,
    resultLabel: 'Schockindex',
    resultUnit: '',
    precision: 2,
    formula: 'SI = Herzfrequenz / systolischer Blutdruck',
    note: 'Der Index allein diagnostiziert keinen Schock. Alter, Schwangerschaft, Betablocker und andere Medikamente beeinflussen die Aussagekraft.',
    sources: [
      source(
        'Singh et al. · Shock Index in Adult Trauma Patients',
        'PLOS ONE 2014;9:e105475 · Prospektive Studie mit 9.860 Personen',
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC4193151/',
      ),
    ],
    keywords: ['allgöwer', 'kreislauf', 'schock'],
  },
  {
    id: 'qtc-bazett',
    title: 'QTc nach Bazett',
    abbreviation: 'QTcB',
    category: 'herz',
    description: 'QT-Intervall mit der Bazett-Formel frequenzkorrigieren.',
    method: 'Bazett · Quadratwurzelkorrektur',
    fields: qtFields(),
    calculate: (v) => v.qt / Math.sqrt(60 / v.heartRate),
    resultLabel: 'Korrigiertes QT-Intervall',
    resultUnit: 'ms',
    precision: 0,
    formula: 'QTcB = QT / √RR',
    formulaDetail: 'QT in ms, RR in Sekunden; RR = 60 / Herzfrequenz.',
    note: 'Bazett überschätzt bei hoher und unterschätzt bei niedriger Herzfrequenz. Bei breitem QRS oder unregelmäßigem Rhythmus ist eine zusätzliche fachliche Beurteilung erforderlich.',
    sources: [qtFormulaSource, qtSource],
    keywords: ['qt', 'qtc', 'bazett', 'ekg'],
  },
  {
    id: 'qtc-fridericia',
    title: 'QTc nach Fridericia',
    abbreviation: 'QTcF',
    category: 'herz',
    description: 'QT-Intervall mit der Fridericia-Formel frequenzkorrigieren.',
    method: 'Fridericia · Kubikwurzelkorrektur',
    fields: qtFields(),
    calculate: (v) => v.qt / Math.cbrt(60 / v.heartRate),
    resultLabel: 'Korrigiertes QT-Intervall',
    resultUnit: 'ms',
    precision: 0,
    formula: 'QTcF = QT / ∛RR',
    formulaDetail: 'QT in ms, RR in Sekunden; RR = 60 / Herzfrequenz.',
    note: 'Auch diese Frequenzkorrektur ist eine Näherung. Bei breitem QRS oder unregelmäßigem Rhythmus ist eine zusätzliche fachliche Beurteilung erforderlich.',
    sources: [qtFormulaSource, qtSource],
    keywords: ['qt', 'qtc', 'fridericia', 'ekg'],
  },
  {
    id: 'horovitz',
    title: 'Horovitz-Index',
    abbreviation: 'P/F',
    category: 'intensiv',
    description: 'Oxygenierung aus arteriellem pO₂ und FiO₂ beurteilen.',
    method: 'PaO₂ / FiO₂',
    fields: [
      number('pao2', 'Arterieller Sauerstoffpartialdruck', 'mmHg', '80', {
        units: [
          { label: 'mmHg', factor: 1, step: 1 },
          { label: 'kPa', factor: 7.50062, step: 0.1 },
        ],
      }),
      number('fio2', 'Inspiratorische Sauerstoffkonzentration', '%', '40', {
        min: 21,
        max: 100,
        units: [
          { label: '%', factor: 1, step: 1 },
          { label: 'Anteil (0–1)', factor: 100, step: 0.01 },
        ],
      }),
    ],
    calculate: (v) => v.pao2 / (v.fio2 / 100),
    resultLabel: 'Horovitz-Index',
    resultUnit: 'mmHg',
    precision: 0,
    formula: 'P/F = PaO₂ / (FiO₂ / 100)',
    formulaDetail: 'PaO₂ in mmHg, FiO₂ als Prozentwert. 1 kPa ≈ 7,50062 mmHg.',
    note: 'Die ARDS-Einordnung erfordert weitere Kriterien, einschließlich PEEP, Bildgebung und zeitlichem Verlauf. Aus dem Index allein keine ARDS-Diagnose ableiten.',
    sources: [
      source(
        'ARDS Definition Task Force · Berlin Definition',
        'JAMA 2012;307:2526–2533 · Oxygenierung und ARDS-Kriterien',
        'https://doi.org/10.1001/jama.2012.5669',
      ),
    ],
    keywords: ['pao2', 'fio2', 'oxygenierung', 'ards', 'horowitz'],
  },
  {
    id: 'atemzugvolumen',
    title: 'Atemzugvolumen nach PBW',
    abbreviation: 'Vₜ',
    category: 'intensiv',
    description: 'Atemzugvolumen aus dem vorhergesagten Körpergewicht.',
    method: 'ARDSNet · 6 ml/kg PBW',
    fields: [height(), sex()],
    calculate: (v) => ((v.sex === 1 ? 50 : 45.5) + 0.91 * (v.height - 152.4)) * 6,
    validate: (v) =>
      (v.sex === 1 ? 50 : 45.5) + 0.91 * (v.height - 152.4) <= 0
        ? 'Für diese Körpergröße ergibt die Erwachsenenformel kein gültiges vorhergesagtes Körpergewicht.'
        : null,
    resultLabel: 'Atemzugvolumen bei 6 ml/kg PBW',
    resultUnit: 'ml',
    precision: 0,
    formula: 'Vₜ = 6 × [F + 0,91 × (Größe − 152,4)]',
    formulaDetail:
      'Größe in cm. F = 50 kg für männlich, 45,5 kg für weiblich. Klammerausdruck = PBW in kg.',
    note: 'Rechenwert für Erwachsene, keine vollständige Beatmungseinstellung. Plateau- und Driving-Pressure, Gasaustausch und klinische Situation berücksichtigen.',
    sources: [
      source(
        'ARDS Network · Lower tidal volumes in ARDS',
        'N Engl J Med 2000;342:1301–1308 · Originalstudie und PBW-Formel',
        'https://doi.org/10.1056/NEJM200005043421801',
      ),
      ardsSource,
    ],
    keywords: ['tidalvolumen', 'beatmung', 'ardsnet', 'pbw', 'lungenprotektiv'],
  },
  {
    id: 'fib4',
    title: 'FIB-4-Index',
    abbreviation: 'FIB-4',
    category: 'leber',
    description: 'Nichtinvasiven Leberfibrose-Index berechnen.',
    method: 'Sterling et al. · 2006',
    fields: [age(), ...liverFields(), number('alt', 'ALT (GPT)', 'U/l', '35')],
    calculate: (v) => (v.age * v.ast) / (v.platelets * Math.sqrt(v.alt)),
    resultLabel: 'FIB-4-Index',
    resultUnit: '',
    precision: 2,
    formula: 'FIB-4 = (Alter × AST) / (Thrombozyten × √ALT)',
    formulaDetail: 'Alter in Jahren, AST/ALT in U/l, Thrombozyten in G/l (10⁹/l).',
    note: 'Grenzwerte unterscheiden sich je nach Grunderkrankung und Alter. Bei akut erhöhten Transaminasen eingeschränkt; kein alleiniger Fibrosenachweis.',
    sources: [
      source(
        'University of Washington · FIB-4 Calculator',
        'Hepatitis C Online · Gleichung und Originalreferenz Sterling et al., 2006',
        'https://www.hepatitisc.uw.edu/page/clinical-calculators/fib-4',
      ),
    ],
    keywords: ['fibrose', 'leber', 'got', 'gpt'],
  },
  {
    id: 'apri',
    title: 'AST/Thrombozyten-Index',
    abbreviation: 'APRI',
    category: 'leber',
    description: 'APRI als nichtinvasiven Leberfibrose-Index berechnen.',
    method: 'AST-to-Platelet Ratio Index',
    fields: [
      ...liverFields(),
      number('astLimit', 'Obere AST-Normgrenze', 'U/l', '40', {
        hint: 'Obere Referenzgrenze des verwendeten Labors.',
      }),
    ],
    calculate: (v) => (v.ast / v.astLimit / v.platelets) * 100,
    resultLabel: 'APRI',
    resultUnit: '',
    precision: 2,
    formula: 'APRI = (AST / AST-Normgrenze) / Thrombozyten × 100',
    formulaDetail: 'AST und Normgrenze in U/l; Thrombozyten in G/l (10⁹/l).',
    note: 'Ursprünglich für chronische Hepatitis C untersucht. Erkrankungsspezifische Grenzwerte verwenden; ein Einzelwert kann eine relevante Fibrose nicht sicher ausschließen.',
    sources: [
      source(
        'University of Washington · APRI Calculator',
        'Hepatitis C Online · Gleichung, Referenzgrenze und Validierungsquellen',
        'https://www.hepatitisc.uw.edu/page/clinical-calculators/apri',
      ),
    ],
    keywords: ['apri', 'ast', 'got', 'fibrose', 'leber'],
  },
];

export function parseGermanNumber(raw: string): number | null {
  const value = raw.trim();
  if (!/^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value)) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function evaluateCalculator(
  calculator: Calculator,
  raw: Record<string, string>,
  unitIndices: Record<string, number> = {},
) {
  const values: Values = {};
  const errors: Record<string, string> = {};
  let complete = true;
  for (const field of calculator.fields) {
    if (!raw[field.id]?.trim()) {
      complete = false;
      continue;
    }
    const parsed = parseGermanNumber(raw[field.id]);
    const factor = field.units?.[unitIndices[field.id] ?? 0]?.factor ?? 1;
    const value = parsed === null ? null : parsed * factor;
    if (
      value === null ||
      (field.options && !field.options.some((option) => Number(option.value) === value))
    )
      errors[field.id] = 'Bitte einen gültigen Wert eingeben.';
    else if (field.min !== undefined && value < field.min)
      errors[field.id] =
        field.min === 0.000001
          ? 'Der Wert muss größer als 0 sein.'
          : `Mindestens ${formatNumber(field.min / factor, 2)} ${field.units?.[unitIndices[field.id] ?? 0]?.label ?? field.unit ?? ''} eingeben.`;
    else if (field.max !== undefined && value > field.max)
      errors[field.id] =
        `Höchstens ${formatNumber(field.max / factor, 2)} ${field.units?.[unitIndices[field.id] ?? 0]?.label ?? field.unit ?? ''} eingeben.`;
    else if (field.integer && !Number.isInteger(value))
      errors[field.id] = 'Bitte eine ganze Zahl eingeben.';
    else values[field.id] = value;
  }
  const valid = complete && Object.keys(errors).length === 0;
  const formError = valid ? (calculator.validate?.(values) ?? null) : null;
  const result = valid && !formError ? calculator.calculate(values) : null;
  return {
    values,
    errors,
    complete,
    formError,
    result: result !== null && Number.isFinite(result) ? result : null,
  };
}

export function formatNumber(value: number, precision: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

export const getCategory = (id: CategoryId) => categories.find((category) => category.id === id)!;
const normalize = (value: string) =>
  value
    .toLocaleLowerCase('de-DE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');
export function searchCalculators(query: string): Calculator[] {
  const words = normalize(query.trim()).split(/\s+/);
  return calculators.filter((calculator) => {
    const haystack = normalize(
      [
        calculator.title,
        calculator.abbreviation,
        calculator.method,
        getCategory(calculator.category).name,
        ...calculator.keywords,
      ].join(' '),
    );
    return words.every((word) => haystack.includes(word));
  });
}
