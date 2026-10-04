# Docsheet

Production: https://docsheet.infiniter.tech

Eine deutschsprachige React-App für schnelle medizinische Berechnungen. 20 Rechner in sechs Fachgebieten, eine durchsuchbare Auswahl, automatisch aktualisierte Ergebnisse und nachvollziehbare medizinische Quellen.

## Starten

```sh
npm install
npm run dev
```

Die App läuft unter http://localhost:5173. Weitere Befehle:

```sh
npm test       # Formeln, Einheiten, Eingabevalidierung und Suche
npm run build # TypeScript-Prüfung und Produktionsbuild
npm run preview
```

## Aufbau

- React, TypeScript und Vite; kein Backend und keine Datenbank.
- `src/calculators.ts` enthält die fest hinterlegte Rechnerliste. Jeder Eintrag beschreibt Eingabefelder, Einheiten, Berechnungsfunktion, Formel, klinische Grenzen und Quellen.
- `src/App.tsx` rendert die gemeinsame Suchauswahl, Übersicht und Formularansicht aus dieser Liste. Die Hash-Routen funktionieren auch auf einfachem statischem Hosting.
- `src/styles.css` enthält das responsive Layout. Schriftarten werden lokal ausgeliefert.

Um einen Rechner hinzuzufügen, einen Eintrag in `calculators` ergänzen und einen unabhängigen numerischen Referenzfall in `src/calculators.test.ts` hinzufügen. Die UI verwendet den Eintrag automatisch.

## Enthaltene Rechner

| Fachgebiet                 | Rechner                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Allgemeinmedizin           | BMI, Körperoberfläche nach Mosteller                                                                                            |
| Nephrologie                | CKD-EPI 2021, Cockcroft–Gault, FENa, FEUrea                                                                                     |
| Elektrolyte & Stoffwechsel | Albuminkorrigiertes Kalzium, Natrium nach Katz, Anionenlücke, albuminkorrigierte Anionenlücke, Serumosmolalität, osmolale Lücke |
| Kardiologie                | Mittlerer arterieller Druck, Schockindex, QTc nach Bazett und Fridericia                                                        |
| Intensivmedizin            | Horovitz-Index, Atemzugvolumen bei 6 ml/kg vorhergesagtem Körpergewicht                                                         |
| Hepatologie                | FIB-4, APRI                                                                                                                     |

## Einheiten und Daten

Dezimalkommas und Dezimalpunkte werden akzeptiert. Laborwerte verwenden im deutschen Klinikalltag verbreitete Einheiten: unter anderem mg/dl bzw. µmol/l für Kreatinin, mg/dl bzw. mmol/l für Glukose und mmol/l bzw. mg/dl für Harnstoff. Albumin kann in g/l oder g/dl eingegeben werden. Beim Wechsel einer Einheit wird ein vorhandener Wert umgerechnet.

Alle Zahlenfelder haben Pfeile zum Erhöhen und Verringern; auch die Pfeiltasten der Tastatur funktionieren. Die Schrittweite richtet sich nach Feld und ausgewählter Einheit, zum Beispiel 0,01 mg/dl bei Kreatinin und 0,01 bei FiO₂ als Anteil. Vorhandene Eingabegrenzen werden dabei berücksichtigt.

Alle Berechnungen laufen im Browser. Eingaben werden weder übertragen noch gespeichert; beim Verlassen eines Rechners werden sie verworfen. Ausschließlich die IDs der favorisierten Rechner werden in `localStorage` gespeichert. Es gibt keine Analyse- oder Trackingdienste.

## Formeln und Quellen

Jeder Rechner zeigt seine genaue Methode, Formel, Einheiten und direkt verlinkte Referenzen. Die Quellen umfassen Originalpublikationen, die National Kidney Foundation, WHO, ARDS Network/NHLBI, AHA/ACCF/HRS, ACEP, University of Washington, NHS und MSD Manual.

Die Rechner sind für Erwachsene vorgesehen. Methodenabhängige Grenzen stehen direkt am Ergebnis: zum Beispiel stabiles Kreatinin bei eGFR, die gewählte Gewichtskonvention bei Cockcroft–Gault und das Fehlen einer Ethanolkorrektur bei der osmolalen Lücke. Diese App ist ein initialer Softwarestand; die Quellen und numerischen Tests ersetzen keine unabhängige klinische Validierung.

## Deployment auf nixpi

Nach dem Commit der Änderungen auf dem Mac `npm run deploy` ausführen. Das Skript
führt Tests und Build aus, überträgt den Git-Commit nach
`/home/infiniter/services/medical-cheatsheet`, lädt `dist` nach
`/var/www/docsheet/releases/<commit>-<timestamp>` und wechselt den Symlink
`/var/www/docsheet/current` atomar. Frühere Releases bleiben für einen Rollback
erhalten. Der GitHub-Remote wird nicht verändert.

Nginx, HTTPS/ACME, Websupport-DDNS und Verzeichnisrechte sind im Repository
`nix-server` für den Host `nixpi` deklariert. In Produktion ist kein Node- oder
Vite-Prozess nötig. HTML wird neu validiert; Dateien unter `/assets/` sind ein
Jahr mit `immutable` cachebar.

Für einen Rollback ein vorhandenes Release aus `ls /var/www/docsheet/releases`
auswählen und den Symlink atomar wechseln:

```sh
ssh infiniter@nixpi.tail6650cb.ts.net 'ln -s releases/<release> /var/www/docsheet/.rollback && mv -Tf /var/www/docsheet/.rollback /var/www/docsheet/current'
```
