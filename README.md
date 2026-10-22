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

Unter jedem Rechner steht ein umrandeter Anatomy-Rechner. Der mittlere arterielle
Druck besitzt als erstes individuelles Modell eine Drittel-Brücke: Zwei
verschiebbare Enden stehen für diastolischen und systolischen Druck. Ein heller
Abnehmer bei einem Drittel des Abstands liest den geschätzten Mitteldruck ab.
Beide Eingaben sind mit dem Hauptformular verbunden. Die Seite startet mit
120/80; Regler, Zahlenfelder, Ziehen an den Knöpfen und Tastatur ändern dieselben
Werte. Oberer Rechner, Instrument und Ergebnis bleiben synchron.

Die Körperoberfläche nach Mosteller besitzt als zweites individuelles Modell
das Wurzelfenster: Größe und Gewicht bestimmen die Hilfsseiten eines Rechtecks.
Eine Formsteuerung überführt es flächentreu in ein Quadrat; dessen Seitenlänge
ist der Zahlenwert der KOF. Eingaben sind mit dem Hauptformular verbunden.
Beide Einflüsse lassen sich einzeln ausprobieren; die Formsteuerung ändert
keinen medizinischen Wert. Die Seite startet mit 175 cm und 75 kg.

Bei den übrigen 18 Rechnern zeigt ein isometrischer Kurvenschreiber die
Originalformel als Kurve: Die gewählte Eingabe bewegt
den Stift in X-Richtung, das Ergebnis bestimmt seine Y-Position. Alle übrigen
Eingaben bleiben für die Kurve konstant. Die 20 Formeln haben eigene Skalen,
Erklärungen und live berechnete Zwischenschritte. Skalen sind illustrative
Ausschnitte und keine klinischen Referenzbereiche; ungültige Eingaben zeichnen
keine Ergebnisse.

Regler, Zahlenfelder und Einheiten erlauben eine zweite Eingabeweise. Beim
Kurvenschreiber werden Werte auf Knopfdruck zwischen Hauptformular und
Anatomy-Rechner übernommen.
Die Kurvenfahrt verändert keine Formularwerte. Tastatur, reduzierte Bewegung und
Pausen außerhalb des sichtbaren Bereichs werden unterstützt.

Die Geometrie liegt vorab generiert in `src/anatomy/plotter-art.json`. Nach
Änderungen an `scripts/build-anatomy.mjs` mit `node scripts/build-anatomy.mjs --audit`
neu erzeugen. Die MIT-lizenzierte Anatomy-Geometriebibliothek liegt neben der
ursprünglichen eigenständigen MAP-Figur unter `docs/anatomy-map/vendor`.
Die individuelle Drittel-Brücke wird mit `npm run anatomy:map:audit` aus
`scripts/map-geometry.mjs` generiert. Ihre Druckskala bleibt bis 240 mmHg
fest und erweitert sich für höhere gültige Eingaben. Die Geometrieprüfung deckt
auch gleiche Drücke, sehr kleine Werte und erweiterte Skalen ab.

Das Wurzelfenster wird mit `npm run anatomy:bsa:audit` erzeugt.
Die Prüfung erfasst Rechteck, Quadrat und Zwischenstellungen bei normalen
Werten und an den Eingabegrenzen. Die Dimensionen, Fläche und Anzeige stammen
aus `src/anatomy/bsa-model.ts`; `scripts/verify-bsa-anatomy.json` prüft die
Browserinteraktionen mit dem Anatomy-Skript `drive.mjs`.

## Formeln und Quellen

Jeder Rechner zeigt seine genaue Methode, Formel, Einheiten und direkt verlinkte Referenzen. Die Quellen umfassen Originalpublikationen, die National Kidney Foundation, WHO, ARDS Network/NHLBI, AHA/ACCF/HRS, ACEP, University of Washington, NHS und MSD Manual.

Die Rechner sind für Erwachsene vorgesehen. Methodenabhängige Grenzen stehen direkt am Ergebnis: zum Beispiel stabiles Kreatinin bei eGFR, die gewählte Gewichtskonvention bei Cockcroft–Gault und das Fehlen einer Ethanolkorrektur bei der osmolalen Lücke. Diese App ist ein initialer Softwarestand; die Quellen und numerischen Tests ersetzen keine unabhängige klinische Validierung.

## Deployment auf nixpi

Nach dem Commit der Änderungen auf dem Mac `npm run deploy` ausführen. Das Skript
führt lokale Tests und Build aus und pusht den Commit auf `origin/main`.
Auf nixpi muss `/home/infiniter/services/medical-cheatsheet` auf einem sauberen
`main` stehen. Dort wird der veröffentlichte Commit per Fast-Forward gepullt,
mit `npm ci` installiert, getestet und gebaut. Erst danach wird das dort gebaute
`dist` nach `/var/www/docsheet/releases/<commit>-<timestamp>` kopiert und der
Symlink `/var/www/docsheet/current` atomar gewechselt. Der Commit wird vor und
nach dem Build geprüft. Frühere Releases bleiben für einen Rollback erhalten.

Nginx, HTTPS/ACME, Websupport-DDNS und Verzeichnisrechte sind im Repository
`nix-server` für den Host `nixpi` deklariert. In Produktion ist kein Node- oder
Vite-Prozess nötig. HTML wird neu validiert; Dateien unter `/assets/` sind ein
Jahr mit `immutable` cachebar.

Für einen Rollback ein vorhandenes Release aus `ls /var/www/docsheet/releases`
auswählen und den Symlink atomar wechseln:

```sh
ssh infiniter@nixpi.tail6650cb.ts.net 'ln -s releases/<release> /var/www/docsheet/.rollback && mv -Tf /var/www/docsheet/.rollback /var/www/docsheet/current'
```
