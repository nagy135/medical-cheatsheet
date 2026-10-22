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

Der Schockindex besitzt als drittes individuelles Modell die Verhältniswaage.
Die Herzfrequenz steht links, der systolische Blutdruck rechts. Ihre Zahlenwerte
bestimmen zwei Modellgewichte und den ausbalancierten Stützpunkt. Das Verhältnis
rechter/linker Hebelarm ergibt den Index. Beide Eingaben sind mit dem Hauptformular
verbunden; die Seite startet mit 90/min und 120 mmHg. Verdopplung beider Werte
lässt Quotient und Stützpunkt unverändert.

Die Anionenlücke besitzt als viertes individuelles Modell den Bilanzschrank.
Links steht Natrium, rechts werden Chlorid und Bikarbonat gestapelt. Ein heller
Streifen zeigt den Betrag des Höhenunterschieds; Ergebnis und Text behalten das
Vorzeichen. Bei null verschwindet der Streifen vollständig. Alle drei Eingaben
sind mit dem Hauptformular verbunden; der Startwert ist 140 / 104 / 24 mmol/l.

QTc nach Bazett besitzt als fünftes individuelles Modell die Bazett-Scheibe,
einen Kreisrechenschieber. QT setzt den grauen Zeiger, der Faktor 1/√RR dreht
die innere Skala, und der helle Zeiger zeigt QTc auf der festen Außenskala.
Winkel werden logarithmisch abgebildet; der gemeinsame Ausschnitt passt sich
an, damit auch Eingabegrenzen nicht um den Kreis herumwickeln. Bei 60/min
liegen beide Zeiger in derselben Richtung. Eingaben und Hauptformular bleiben
synchron; Startwerte sind 400 ms und 75/min.

Der Horovitz-Index besitzt als sechstes individuelles Modell eine O₂-Normierbank.
Links zeigt ein Schieber den Sauerstoffanteil; rechts stehen PaO₂ und der
berechnete P/F auf derselben Druckskala. Beide Eingaben und ihre Einheiten
(mmHg/kPa, Prozent/Anteil) sind mit dem Hauptrechner verbunden.

Albuminkorrigiertes Kalzium besitzt als siebtes individuelles Modell einen
Korrekturschlitten. Kalzium bewegt die untere Stufe; Albumin setzt einen
vorzeichenbehafteten Versatz auf der zweiten Schiene. Albumin-Einheiten und
Eingaben sind mit dem Hauptrechner verbunden; 40 g/l setzt den Versatz auf null.

Bei den übrigen 13 Rechnern zeigt ein isometrischer Kurvenschreiber die
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

Die Verhältniswaage wird mit `npm run anatomy:shock:audit` erzeugt. Die
Geometrieprüfung umfasst ausgeglichene und extreme Verhältnisse sowie gemeinsam
skalierte Eingaben. `scripts/verify-shock-anatomy.json` prüft die beiden
Eingabeeinflüsse, Proportionalität, geteilten Formularzustand und Bedienung
mit dem Anatomy-Skript `drive.mjs`.

Der Bilanzschrank wird mit `npm run anatomy:anion:audit` erzeugt.
`src/anatomy/anion-solid.ts` liefert dieselben Körpergrenzen und SVG-Flächen für
Generator und Browser. Der gemeinsame Zeichenmaßstab erweitert sich für große
Werte; normalisierte Addition vermeidet einen unnötigen Überlauf von Cl + HCO₃.
Die Geometrieprüfung erfasst positive, bündige, negative und extreme Fälle.
`scripts/verify-anion-anatomy.json` prüft alle drei Einflüsse, Gegenänderungen,
Vorzeichen, gemeinsamen Formularzustand, Reset sowie Ziehen und Tastatur.

Die Bazett-Scheibe wird mit `npm run anatomy:bazett:audit` erzeugt.
`src/anatomy/bazett-solid.ts` liefert die tatsächlichen Zeigerpolygone und
Skalenpositionen für Generator und Browser. Drehende Teile werden in der
Instrumentenebene neu projiziert. Die Geometrieprüfung umfasst beide
Eingabegrenzen, die Identität bei 60/min und niedrige sowie hohe Frequenzen.
`scripts/verify-bazett-anatomy.json` prüft beide Eingabeeinflüsse, die
Quadratwurzelskalierung, Formularsynchronisierung und Bedienung.

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

Die O₂-Normierbank wird mit `npm run anatomy:horovitz:audit` erzeugt.
Der Audit prüft die echten Formen und eine gemeinsame Zeichenreihenfolge in
zehn Stellungen, einschließlich 21 %, 100 %, sehr kleiner und großer Drücke.
`src/anatomy/horovitz-model.test.ts` prüft Formel, Einfluss beider Eingaben und
alle vier Kombinationen der Einheiten. Browser-Sequenzen stehen in
`scripts/verify-horovitz-anatomy.json`.

Der Korrekturschlitten wird mit `npm run anatomy:calcium:audit` erzeugt.
Der Audit prüft echte Formen und die gemeinsame Zeichenreihenfolge in zehn
Stellungen, einschließlich negativer Korrekturen, Nullwert und erweitertem
Maßstab. Modelltests und `scripts/verify-calcium-anatomy.json` prüfen beide
Eingaben, Albumin-Einheiten, Vorzeichen und die Synchronisierung der Formulare.
