import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calculator as CalculatorIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FlaskConical,
  Grid2X2,
  HeartPulse,
  Info,
  Menu,
  PersonStanding,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import {
  calculators,
  categories,
  evaluateCalculator,
  formatNumber,
  getCategory,
  parseGermanNumber,
  searchCalculators,
} from './calculators';
import type { Calculator, Field } from './calculators';
import { NumericInput } from './NumericInput';
import { AnatomyCalculator } from './anatomy/AnatomyCalculator';
const ShockAnatomy = lazy(() =>
  import('./anatomy/ShockAnatomy').then(({ ShockAnatomy }) => ({ default: ShockAnatomy })),
);
const BsaAnatomy = lazy(() =>
  import('./anatomy/BsaAnatomy').then(({ BsaAnatomy }) => ({ default: BsaAnatomy })),
);
const MapAnatomy = lazy(() =>
  import('./anatomy/MapAnatomy').then(({ MapAnatomy }) => ({ default: MapAnatomy })),
);

function MedicalIcon({ name, size = 22 }: { name: string; size?: number }) {
  if (name === 'heart') return <HeartPulse size={size} strokeWidth={1.6} />;
  if (name === 'body') return <PersonStanding size={size} strokeWidth={1.6} />;
  if (name === 'flask') return <FlaskConical size={size} strokeWidth={1.6} />;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'kidney' ? (
        <>
          <path d="M8.5 4C4.7 2 2 5.9 2 10.5c0 4.2 2.1 8 5.5 8 2.3 0 3.3-2.1 2.6-3.7-.7-1.6-2.5-1.2-2.5-3s1.8-1.5 2.5-3.1C10.7 7.2 10.2 5 8.5 4Z" />
          <path d="M15.5 4c3.8-2 6.5 1.9 6.5 6.5 0 4.2-2.1 8-5.5 8-2.3 0-3.3-2.1-2.6-3.7.7-1.6 2.5-1.2 2.5-3s-1.8-1.5-2.5-3.1C13.3 7.2 13.8 5 15.5 4Z" />
          <path d="M10 10.5c1.3 0 2 1.5 2 3.5v7m2-10.5c-1.3 0-2 1.5-2 3.5" />
        </>
      ) : name === 'lungs' ? (
        <>
          <path d="M12 3v7m0 0-4 4m4-4 4 4" />
          <path d="M9 6C6 7 2 12 2 17c0 3 2 4 5 3l2-1V6Zm6 0c3 1 7 6 7 11 0 3-2 4-5 3l-2-1V6Z" />
        </>
      ) : (
        <>
          <path d="M3 8c4-2 7-3 12-2l6 1c1 1 1 3-1 4l-7 4-6 4c-2 1-4 0-4-2V8Z" />
          <path d="m13 7-1 7m1-6 7 2" />
        </>
      )}
    </svg>
  );
}

function Logo() {
  return (
    <a className="brand" href="#/" aria-label="Docsheet – Startseite">
      <span className="brand-icon">
        <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M14 5h8v9h9v8h-9v9h-8v-9H5v-8h9z" fill="currentColor" />
          <path d="m5 14 9 8V14h8l9 8" stroke="#153e35" strokeWidth="1.2" />
        </svg>
      </span>
      <span className="brand-name">
        <span className="brand-doc">doc</span>
        <span className="brand-sheet">sheet</span>
        <span className="brand-dot">.</span>
      </span>
    </a>
  );
}

function useRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');
  useEffect(() => {
    const update = () => {
      setRoute(window.location.hash.slice(1) || '/');
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

function readFavorites(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('docsheet-favorites') || '[]');
    return Array.isArray(saved)
      ? [
          ...new Set(
            saved.filter(
              (id): id is string => typeof id === 'string' && calculators.some((c) => c.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

function SearchSelector({
  query,
  setQuery,
  navigate,
}: {
  query: string;
  setQuery: (query: string) => void;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const matches = searchCalculators(query);
  const suggestions = (
    query.trim()
      ? matches
      : ['egfr', 'bmi', 'natrium', 'qtc-bazett', 'map', 'horovitz'].map((id) =>
          calculators.find((c) => c.id === id)!,
        )
  ).slice(0, 8);
  const select = (calculator: Calculator) => {
    navigate(`/rechner/${calculator.id}`);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    const outside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', shortcut);
    document.addEventListener('mousedown', outside);
    return () => {
      document.removeEventListener('keydown', shortcut);
      document.removeEventListener('mousedown', outside);
    };
  }, []);
  return (
    <div className={`search-wrapper ${open ? 'search-open' : ''}`} ref={wrapperRef}>
      <Search size={19} className="search-icon" />
      <input
        ref={inputRef}
        className="global-search"
        type="text"
        role="combobox"
        aria-label="Medizinischen Rechner suchen"
        aria-expanded={open}
        aria-controls="search-options"
        aria-autocomplete="list"
        aria-activedescendant={
          open && suggestions[active] ? `search-${suggestions[active].id}` : undefined
        }
        autoComplete="off"
        placeholder="Rechner suchen, z. B. eGFR, BMI, QTc …"
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!wrapperRef.current?.contains(event.relatedTarget)) setOpen(false);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, suggestions.length - 1));
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          }
          if (event.key === 'Enter' && suggestions[active]) {
            event.preventDefault();
            select(suggestions[active]);
          }
        }}
      />
      {query ? (
        <button
          className="icon-button search-clear"
          aria-label="Suche leeren"
          onClick={() => {
            setQuery('');
            setActive(0);
            inputRef.current?.focus();
          }}
        >
          <X size={16} />
        </button>
      ) : (
        <kbd className="search-shortcut">⌘ K</kbd>
      )}
      {open && (
        <div className="search-dropdown">
          <div className="search-caption">
            {query.trim() ? `${matches.length} passende Rechner` : 'Schnell zum Rechner'}
          </div>
          <div id="search-options" role="listbox" aria-label="Passende Rechner">
            {suggestions.map((calculator, index) => {
              const category = getCategory(calculator.category);
              return (
                <div
                  key={calculator.id}
                  id={`search-${calculator.id}`}
                  role="option"
                  aria-selected={active === index}
                  className={`search-option ${active === index ? 'active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(calculator)}
                >
                  <span className={`medical-icon ${category.color}`}>
                    <MedicalIcon name={category.icon} size={20} />
                  </span>
                  <span className="search-option-text">
                    <strong>{calculator.title}</strong>
                    <span>
                      {category.name} · {calculator.method}
                    </span>
                  </span>
                  <span className="search-abbr">{calculator.abbreviation}</span>
                  <ArrowUpRight size={16} />
                </div>
              );
            })}
            {!suggestions.length && (
              <div className="search-no-results">
                Kein passender Rechner. Versuchen Sie einen anderen Begriff.
              </div>
            )}
          </div>
          <div className="search-footer">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> auswählen
            </span>
            <span>
              <kbd>↵</kbd> öffnen
            </span>
            <span>
              <kbd>esc</kbd> schließen
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function CalculatorCard({
  calculator,
  favorite,
  toggleFavorite,
  navigate,
  compact = false,
}: {
  calculator: Calculator;
  favorite: boolean;
  toggleFavorite: (id: string) => void;
  navigate: (path: string) => void;
  compact?: boolean;
}) {
  const category = getCategory(calculator.category);
  return (
    <article className={`calculator-card ${compact ? 'compact-card' : ''}`}>
      <div className="card-top">
        <span className={`medical-icon ${category.color}`}>
          <MedicalIcon name={category.icon} size={compact ? 22 : 24} />
        </span>
        <button
          className={`favorite-button ${favorite ? 'is-favorite' : ''}`}
          aria-label={`${calculator.title} ${favorite ? 'aus Favoriten entfernen' : 'zu Favoriten hinzufügen'}`}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(calculator.id)}
        >
          <Star size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <a
        className="card-link"
        href={`#/rechner/${calculator.id}`}
        onClick={(event) => {
          event.preventDefault();
          navigate(`/rechner/${calculator.id}`);
        }}
      >
        <span className="card-abbreviation">{calculator.abbreviation}</span>
        <h3>{calculator.title}</h3>
        <p>{calculator.description}</p>
        <span className="card-bottom">
          <span>{compact ? category.short : calculator.method}</span>
          <span className="card-arrow">
            <ArrowUpRight size={18} />
          </span>
        </span>
      </a>
    </article>
  );
}

function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-grid" />
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <span className="art-cross">+</span>
      <div className="art-formula">
        <span>eGFR</span>
        <span className="art-formula-line" />
        <span>ml/min</span>
        <Check size={14} />
      </div>
      <div className="art-pulse">
        <Activity size={28} strokeWidth={1.3} />
      </div>
      <div className="art-caption">
        <span className="green-dot" /> Für klare Entscheidungen.
      </div>
    </div>
  );
}

function CalculatorPage({
  calculator,
  favorite,
  toggleFavorite,
}: {
  calculator: Calculator;
  favorite: boolean;
  toggleFavorite: (id: string) => void;
}) {
  const [raw, setRaw] = useState<Record<string, string>>((): Record<string, string> =>
    calculator.id === 'map'
      ? { systolic: '120', diastolic: '80' }
      : calculator.id === 'koerperoberflaeche'
        ? { height: '175', weight: '75' }
        : calculator.id === 'schockindex'
          ? { heartRate: '90', systolic: '120' }
          : {},
  );
  const [units, setUnits] = useState<Record<string, number>>({});
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstInput = useRef<HTMLInputElement>(null);
  const category = getCategory(calculator.category);
  const evaluation = evaluateCalculator(calculator, raw, units);
  const result = evaluation.result;
  const populated = calculator.fields.filter((field) => raw[field.id]?.trim()).length;
  const example = () => {
    setUnits({});
    setRaw(Object.fromEntries(calculator.fields.map((field) => [field.id, field.example])));
    setCopyState('idle');
  };
  const reset = () => {
    setRaw({});
    setUnits({});
    setCopyState('idle');
    firstInput.current?.focus();
  };
  useEffect(
    () => () => {
      clearTimeout(copyTimeout.current);
    },
    [],
  );
  const copy = async () => {
    if (result === null) return;
    try {
      await navigator.clipboard.writeText(
        `${calculator.resultLabel}: ${formatNumber(result, calculator.precision)}${calculator.resultUnit ? ` ${calculator.resultUnit}` : ''}\nMethode: ${calculator.method}`,
      );
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopyState('idle'), 2500);
  };
  const changeUnit = (field: Field, next: number) => {
    const parsed = parseGermanNumber(raw[field.id] || '');
    const previous = units[field.id] ?? 0;
    if (parsed !== null && field.units) {
      const converted = (parsed * field.units[previous].factor) / field.units[next].factor;
      setRaw((current) => ({
        ...current,
        [field.id]: String(Number(converted.toPrecision(12))).replace('.', ','),
      }));
    }
    setUnits((current) => ({ ...current, [field.id]: next }));
    setCopyState('idle');
  };
  return (
    <div className="detail-page">
      <a href="#/" className="back-link">
        <ArrowLeft size={16} /> Alle Rechner
      </a>
      <div className="detail-heading">
        <div className={`medical-icon heading-icon ${category.color}`}>
          <MedicalIcon name={category.icon} size={30} />
        </div>
        <div>
          <div className="eyebrow">
            {category.name} <span> / </span> {calculator.abbreviation}
          </div>
          <h1>{calculator.title}</h1>
          <p>{calculator.description}</p>
        </div>
        <button
          className={`detail-favorite icon-button ${favorite ? 'is-favorite' : ''}`}
          aria-label={favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(calculator.id)}
        >
          <Star size={21} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="method-pill">
        <BookOpen size={14} /> {calculator.method}
      </div>
      <div className="calculation-layout">
        <section className="input-panel">
          <div className="panel-heading">
            <h2>Eingabewerte</h2>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={14} /> Zurücksetzen
            </button>
          </div>
          <p className="panel-description">Werte eingeben. Das Ergebnis erscheint automatisch.</p>
          <form onSubmit={(event) => event.preventDefault()} noValidate>
            <div className="fields-grid">
              {calculator.fields.map((field, index) => (
                <div className={`field ${field.options ? 'select-field' : ''}`} key={field.id}>
                  <label htmlFor={`field-${field.id}`}>{field.label}</label>
                  {field.options ? (
                    <div
                      className="segmented-control"
                      role="group"
                      aria-labelledby={`label-${field.id}`}
                    >
                      <span className="sr-only" id={`label-${field.id}`}>
                        {field.label}
                      </span>
                      {field.options.map((option) => (
                        <button
                          key={option.value}
                          id={option === field.options![0] ? `field-${field.id}` : undefined}
                          type="button"
                          aria-pressed={raw[field.id] === option.value}
                          onClick={() => {
                            setRaw((current) => ({ ...current, [field.id]: option.value }));
                            setCopyState('idle');
                          }}
                          className={raw[field.id] === option.value ? 'selected' : ''}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <NumericInput
                      field={field}
                      inputRef={index === 0 ? firstInput : undefined}
                      value={raw[field.id] || ''}
                      unitIndex={units[field.id] ?? 0}
                      error={evaluation.errors[field.id]}
                      onChange={(value) => {
                        setRaw((current) => ({ ...current, [field.id]: value }));
                        setCopyState('idle');
                      }}
                      onUnitChange={(unitIndex) => changeUnit(field, unitIndex)}
                    />
                  )}
                  {evaluation.errors[field.id] ? (
                    <span className="field-error" id={`error-${field.id}`}>
                      {evaluation.errors[field.id]}
                    </span>
                  ) : field.hint ? (
                    <span className="field-hint" id={`hint-${field.id}`}>
                      {field.hint}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </form>
          {evaluation.formError && (
            <div className="form-error" role="alert">
              <Info size={16} />
              {evaluation.formError}
            </div>
          )}
          <div className="input-panel-footer">
            <span>
              <ShieldCheck size={15} /> Eingaben bleiben auf Ihrem Gerät.
            </span>
            <button className="text-button" onClick={example}>
              Beispiel einsetzen <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section
          className={`result-panel ${result !== null ? 'result-ready' : ''}`}
          aria-labelledby="result-heading"
        >
          <div className="result-heading">
            <span className="eyebrow" id="result-heading">
              IHR ERGEBNIS
            </span>
            <span className="live-label">
              <span className="green-dot" /> Live-Berechnung
            </span>
          </div>
          <div className="result-display" aria-live="polite" aria-atomic="true">
            <span className="result-name">{calculator.resultLabel}</span>
            <div className="result-number">
              {result !== null ? formatNumber(result, calculator.precision) : '—'}
            </div>
            <span className="result-unit">{calculator.resultUnit || 'Dimensionsloser Index'}</span>
            {result !== null && calculator.interpret && (
              <span className="interpretation">
                <Check size={16} />
                {calculator.interpret(result, evaluation.values)}
              </span>
            )}
            {result === null && (
              <p className="result-prompt">
                {Object.keys(evaluation.errors).length || evaluation.formError
                  ? 'Bitte prüfen Sie Ihre Eingaben.'
                  : 'Geben Sie alle Werte ein, um das Ergebnis zu berechnen.'}
              </p>
            )}
          </div>
          <div className="result-footer">
            {result !== null ? (
              <button className="copy-button" onClick={copy}>
                {copyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}
                {copyState === 'copied'
                  ? 'Ergebnis kopiert'
                  : copyState === 'error'
                    ? 'Kopieren nicht möglich'
                    : 'Ergebnis kopieren'}
              </button>
            ) : (
              <span className="completion">
                <span className="completion-track">
                  <span style={{ width: `${(populated / calculator.fields.length) * 100}%` }} />
                </span>
                {populated} von {calculator.fields.length} Werten
              </span>
            )}
          </div>
        </section>
      </div>
      {calculator.id === 'map' ? (
        <Suspense fallback={<p className="panel-description">Instrument wird geladen …</p>}>
          <MapAnatomy
            raw={raw}
            onChange={(field, value) => {
              setRaw((current) => ({ ...current, [field]: value }));
              setCopyState('idle');
            }}
            onPreset={(values) => {
              setRaw(values);
              setCopyState('idle');
            }}
          />
        </Suspense>
      ) : calculator.id === 'koerperoberflaeche' ? (
        <Suspense fallback={<p className="panel-description">Instrument wird geladen …</p>}>
          <BsaAnatomy
            raw={raw}
            onChange={(field, value) => {
              setRaw((current) => ({ ...current, [field]: value }));
              setCopyState('idle');
            }}
            onPreset={(values) => {
              setRaw(values);
              setCopyState('idle');
            }}
          />
        </Suspense>
      ) : calculator.id === 'schockindex' ? (
        <Suspense fallback={<p className="panel-description">Instrument wird geladen …</p>}>
          <ShockAnatomy
            raw={raw}
            onChange={(field, value) => {
              setRaw((current) => ({ ...current, [field]: value }));
              setCopyState('idle');
            }}
            onPreset={(values) => {
              setRaw(values);
              setCopyState('idle');
            }}
          />
        </Suspense>
      ) : (
        <AnatomyCalculator
          key={calculator.id}
          calculator={calculator}
          mainRaw={raw}
          mainUnits={units}
          onApply={(values) => {
            setRaw(values);
            setUnits({});
            setCopyState('idle');
          }}
        />
      )}
      <div className="clinical-note">
        <Info size={19} />
        <div>
          <strong>Klinische Einordnung</strong>
          <p>{calculator.note}</p>
        </div>
      </div>
      <div className="reference-layout">
        <section className="formula-panel">
          <div className="section-label">
            <CalculatorIcon size={17} />
            <h2>Die Formel dahinter</h2>
          </div>
          <div className="formula">{calculator.formula}</div>
          {calculator.formulaDetail && <p>{calculator.formulaDetail}</p>}
        </section>
        <section className="sources-panel">
          <div className="section-label">
            <BookOpen size={17} />
            <h2>Medizinische Quellen</h2>
            <span className="small-count">{calculator.sources.length}</span>
          </div>
          <div className="sources-list">
            {calculator.sources.map((source, index) => (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
                key={source.url}
              >
                <span className="source-number">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{source.title}</strong>
                  <span>{source.detail}</span>
                </span>
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
        </section>
      </div>
      <div className="detail-bottom">
        <ShieldCheck size={15} /> Ergebnisse im klinischen Kontext beurteilen.{' '}
        <a href="#/">
          Anderen Rechner auswählen <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState('recommended');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const categoryId = route.startsWith('/fachgebiet/') ? route.split('/')[2] : null;
  const category = categories.find((item) => item.id === categoryId);
  const favoritesOnly = route === '/favoriten';
  const calculatorId = route.startsWith('/rechner/') ? route.split('/')[2] : null;
  const calculator = calculators.find((item) => item.id === calculatorId);
  const invalidRoute = route !== '/' && !favoritesOnly && !category && !calculator;
  const navigate = (path: string) => {
    window.location.hash = path;
    setQuery('');
    setSidebarOpen(false);
  };
  const toggleFavorite = (id: string) =>
    setFavorites((previous) => {
      const next = previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id];
      try {
        localStorage.setItem('docsheet-favorites', JSON.stringify(next));
      } catch {
        /* Favorites work in memory if storage is unavailable. */
      }
      return next;
    });
  useEffect(() => {
    setSidebarOpen(false);
    setQuery('');
    document.title = `${calculator ? calculator.title : category ? category.name : favoritesOnly ? 'Favoriten' : 'Medizinische Rechner'} · Docsheet`;
  }, [route, calculator, category, favoritesOnly]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);
  const filtered = searchCalculators(query).filter(
    (item) =>
      (!category || item.category === category.id) &&
      (!favoritesOnly || favorites.includes(item.id)),
  );
  if (sort === 'alpha') filtered.sort((a, b) => a.title.localeCompare(b.title, 'de'));
  const popular = ['bmi', 'egfr', 'natrium', 'qtc-bazett'].map((id) =>
    calculators.find((item) => item.id === id)!,
  );
  const isOverview = !category && !favoritesOnly && !calculator && !invalidRoute;
  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Menü schließen"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-visible' : ''}`}
        onClick={(event) => {
          if ((event.target as Element).closest('a')) {
            setSidebarOpen(false);
            setQuery('');
          }
        }}
      >
        <Logo />
        <div className="brand-subtitle">MEDIZINISCHE RECHNER</div>
        <button
          className="mobile-sidebar-close icon-button"
          aria-label="Menü schließen"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={21} />
        </button>
        <div className="sidebar-section-title">ARBEITSPLATZ</div>
        <nav aria-label="Hauptnavigation">
          <a
            href="#/"
            className={`nav-item ${isOverview ? 'nav-active' : ''}`}
            onClick={() => {
              setQuery('');
              setSidebarOpen(false);
            }}
          >
            <Grid2X2 size={18} />
            Alle Rechner<span className="nav-count">{calculators.length}</span>
          </a>
          <a href="#/favoriten" className={`nav-item ${favoritesOnly ? 'nav-active' : ''}`}>
            <Star size={18} />
            Favoriten<span className="nav-count">{favorites.length}</span>
          </a>
        </nav>
        <div className="sidebar-section-title specialty-label">FACHGEBIETE</div>
        <nav aria-label="Fachgebiete">
          {categories.map((item) => (
            <a
              key={item.id}
              href={`#/fachgebiet/${item.id}`}
              className={`nav-item specialty-nav ${category?.id === item.id || calculator?.category === item.id ? 'nav-active' : ''}`}
            >
              <MedicalIcon name={item.icon} size={18} />
              <span>{item.name}</span>
              <span className="specialty-count">
                {calculators.filter((c) => c.category === item.id).length}
              </span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="sidebar-note-icon">
              <ShieldCheck size={20} />
            </span>
            <strong>Nachvollziehbar rechnen.</strong>
            <p>Jede Formel mit medizinischer Quelle. Jede Eingabe bleibt lokal.</p>
          </div>
          <button className="about-button" onClick={() => dialogRef.current?.showModal()}>
            <Info size={17} />
            Über Docsheet
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-version">
            <span className="green-dot" /> Für den klinischen Alltag <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Menü öffnen"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="topbar-breadcrumb">
            <Grid2X2 size={16} />
            <span>{calculator ? 'Rechner' : favoritesOnly ? 'Favoriten' : 'Rechnerübersicht'}</span>
            {calculator && (
              <>
                <ChevronRight size={13} />
                <span>{calculator.abbreviation}</span>
              </>
            )}
          </div>
          <SearchSelector query={query} setQuery={setQuery} navigate={navigate} />
          <button
            className="topbar-info icon-button"
            aria-label="Informationen zu Docsheet"
            onClick={() => dialogRef.current?.showModal()}
          >
            <Info size={19} />
          </button>
        </header>
        <main id="main-content">
          {calculator ? (
            <CalculatorPage
              key={calculator.id}
              calculator={calculator}
              favorite={favorites.includes(calculator.id)}
              toggleFavorite={toggleFavorite}
            />
          ) : invalidRoute ? (
            <div className="empty-state">
              <Search size={32} />
              <h1>Rechner nicht gefunden</h1>
              <p>Dieser Link führt zu keinem verfügbaren Rechner.</p>
              <button className="primary-button" onClick={() => navigate('/')}>
                Zur Übersicht <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span className="green-dot" /> WISSEN, DAS IM ALLTAG HILFT
                  </div>
                  <h1>
                    {favoritesOnly ? (
                      <>
                        Ihre Rechner.
                        <br />
                        <span>Ein Griff entfernt.</span>
                      </>
                    ) : category ? (
                      <>
                        {category.name === 'Elektrolyte & Stoffwechsel' ? (
                          <>
                            Elektrolyte &<br />
                            Stoffwechsel.
                          </>
                        ) : (
                          <>
                            {category.name}.<br />
                            <span>Direkt zur Hand.</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        Die richtige Formel.
                        <br />
                        <span>Direkt zur Hand.</span>
                      </>
                    )}
                  </h1>
                  <p>
                    {favoritesOnly ? (
                      'Ihre persönlichen Favoriten für den schnellen Zugriff.'
                    ) : category ? (
                      `Alle ${category.name.toLowerCase().includes('medizin') ? 'passenden' : 'zugehörigen'} Rechner – mit transparenten Formeln und Quellen.`
                    ) : (
                      <>
                        Medizinische Berechnungen, die Ihnen Zeit sparen.
                        <br className="desktop-break" /> Finden. Eingeben. Klarheit bekommen.
                      </>
                    )}
                  </p>
                  <div className="hero-meta">
                    <span>
                      <CalculatorIcon size={15} />
                      {favoritesOnly
                        ? favorites.length
                        : category
                          ? calculators.filter((c) => c.category === category.id).length
                          : calculators.length}{' '}
                      Rechner
                    </span>
                    <span className="meta-divider" />{' '}
                    <span>
                      <BookOpen size={15} />
                      Mit medizinischen Quellen
                    </span>
                  </div>
                </div>
                <HeroArt />
              </section>
              {isOverview && !query && (
                <section className="quick-section">
                  <div className="section-heading">
                    <div>
                      <span className="section-heading-icon">
                        <Sparkles size={17} />
                      </span>
                      <h2>Häufig verwendet</h2>
                    </div>
                    <span className="section-subtitle">Für den schnellen Zugriff</span>
                  </div>
                  <div className="quick-grid">
                    {popular.map((item) => (
                      <CalculatorCard
                        key={item.id}
                        calculator={item}
                        favorite={favorites.includes(item.id)}
                        toggleFavorite={toggleFavorite}
                        navigate={navigate}
                        compact
                      />
                    ))}
                  </div>
                </section>
              )}
              <section className="catalog-section">
                <div className="catalog-heading">
                  <div>
                    <h2>
                      {query.trim()
                        ? 'Suchergebnisse'
                        : favoritesOnly
                          ? 'Ihre Favoriten'
                          : category
                            ? `Rechner für ${category.short}`
                            : 'Alle Rechner'}
                    </h2>
                    <span className="small-count">{filtered.length}</span>
                  </div>
                  <label className="sort-control">
                    Sortieren:{' '}
                    <select
                      aria-label="Rechner sortieren"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      <option value="recommended">Empfohlen</option>
                      <option value="alpha">A–Z</option>
                    </select>
                    <ChevronDown size={13} />
                  </label>
                </div>
                {!favoritesOnly && (
                  <div className="category-tabs" aria-label="Rechner nach Fachgebiet filtern">
                    <button className={!category ? 'tab-active' : ''} onClick={() => navigate('/')}>
                      Alle Fachgebiete
                    </button>
                    {categories.map((item) => (
                      <button
                        key={item.id}
                        className={category?.id === item.id ? 'tab-active' : ''}
                        onClick={() => navigate(`/fachgebiet/${item.id}`)}
                      >
                        {item.short}
                      </button>
                    ))}
                  </div>
                )}
                {query && (
                  <div className="filter-summary">
                    <span>Ergebnisse für „{query}“</span>
                    <button className="text-button" onClick={() => setQuery('')}>
                      Suche leeren <X size={13} />
                    </button>
                  </div>
                )}
                {filtered.length ? (
                  <div className="catalog-grid">
                    {filtered.map((item) => (
                      <CalculatorCard
                        key={item.id}
                        calculator={item}
                        favorite={favorites.includes(item.id)}
                        toggleFavorite={toggleFavorite}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    {favoritesOnly && !query ? <Star size={32} /> : <Search size={32} />}
                    <h3>
                      {favoritesOnly && !query
                        ? 'Ihre Favoriten beginnen mit einem Stern.'
                        : 'Kein passender Rechner gefunden.'}
                    </h3>
                    <p>
                      {favoritesOnly && !query
                        ? 'Markieren Sie einen Rechner mit dem Stern, um ihn hier zu speichern.'
                        : 'Versuchen Sie einen anderen Suchbegriff oder ein anderes Fachgebiet.'}
                    </p>
                    <button className="primary-button" onClick={() => navigate('/')}>
                      Alle Rechner ansehen <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </section>
              <div className="overview-footer">
                <span>
                  <ShieldCheck size={15} />
                  Lokal berechnet. Transparent belegt.
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Nach oben <ArrowDown size={14} className="up-arrow" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      <dialog ref={dialogRef} className="about-dialog">
        <button
          className="dialog-close icon-button"
          aria-label="Informationen schließen"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={21} />
        </button>
        <span className="dialog-emblem">
          <CalculatorIcon size={29} />
        </span>
        <div className="eyebrow">DOCSHEET · VERSION 1.0</div>
        <h2>
          Mehr Zeit für
          <br />
          das Wesentliche.
        </h2>
        <p>
          20 medizinische Rechner für Erwachsene, verständliche Eingaben und Ergebnisse auf einen
          Blick.
        </p>
        <div className="about-feature">
          <BookOpen size={20} />
          <div>
            <strong>Jede Formel ist nachvollziehbar.</strong>
            <p>
              Die Quellen und die genaue Methode stehen direkt beim Rechner. Einschränkungen helfen
              bei der klinischen Einordnung.
            </p>
          </div>
        </div>
        <div className="about-feature">
          <ShieldCheck size={20} />
          <div>
            <strong>Ihre Eingaben bleiben lokal.</strong>
            <p>
              Die Berechnung läuft in Ihrem Browser. Eingabewerte werden weder gespeichert noch
              übertragen. Nur Favoriten werden auf diesem Gerät gespeichert.
            </p>
          </div>
        </div>
        <div className="about-feature">
          <FlaskConical size={20} />
          <div>
            <strong>Einheiten aus dem deutschen Klinikalltag.</strong>
            <p>
              Dezimalkommas und alternative Laboreinheiten werden unterstützt. Ergebnisse sind im
              klinischen Kontext zu beurteilen.
            </p>
          </div>
        </div>
        <button className="primary-button" onClick={() => dialogRef.current?.close()}>
          Zurück zu den Rechnern <ArrowRight size={16} />
        </button>
      </dialog>
    </div>
  );
}
