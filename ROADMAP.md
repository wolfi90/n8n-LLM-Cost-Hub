# apiroute.dev Roadmap

Stand: 2026-05-19  
Status: Planung, Umsetzung noch nicht gestartet

## Ziel

`apiroute.dev` soll von einer reinen Preisvergleichsseite zu einem Entscheidungstool fuer LLM-Auswahl werden.

Die zentrale Nutzerfrage:

```text
Welches Modell soll ich fuer diesen konkreten Job nehmen, warum, und was kostet es?
```

Die Seite soll fuer drei Zielgruppen nuetzlich sein:

- Entwickler, CTOs und AI-Builder, die schnell eine Modellentscheidung treffen muessen.
- Startups und kleine Teams, die API-Kosten kontrollieren wollen.
- KI-Agenten, die maschinenlesbare Preisdaten und Tool-Metadaten brauchen.

## Leitprinzipien

- Keine unbestaetigten Modellnamen oder Preise anzeigen.
- Preise immer als Vergleichsdaten behandeln und Quellen sichtbar machen.
- Die Seite soll Entscheidungen erleichtern, nicht nur Tabellen zeigen.
- Jeder Ausbau muss ohne komplexes Backend funktionieren, solange es sinnvoll geht.
- Monetarisierung darf die Glaubwuerdigkeit nicht beschaedigen.

## P1: Vertrauen und Datenqualitaet sichtbar machen

Ziel: Nutzer sollen sofort verstehen, wie aktuell und belastbar die Daten sind.

Todos:

- [ ] Im Hero oder Tabellenkopf den Datenstand aus `metadata.generated_at` anzeigen.
- [ ] Datenquelle sichtbar verlinken: LiteLLM Pricing Source.
- [ ] Hinweis einbauen: Preise vor produktivem Einkauf beim Anbieter pruefen.
- [ ] Anzahl der aktuell gelisteten Modelle anzeigen.
- [ ] Kennzeichnung fuer `preview`, `reasoning`, `multi-agent`, `open-weight` und `enterprise-rag` vorbereiten.
- [ ] Erklaeren, warum manche Research-Modelle fehlen, wenn sie nicht in der Preisquelle vorhanden sind.

Akzeptanz:

- Ein Besucher sieht innerhalb von 5 Sekunden, ob die Seite aktuell ist.
- Ein Agent kann aus `llms.txt` erkennen, welche Datenquelle und welcher Scope gelten.

## P1: Model Recommendation / Best Route

Ziel: Die Seite gibt eine konkrete Empfehlung statt nur eine Preisliste.

Status: V1 clientseitig umgesetzt. Empfehlungen werden regelbasiert aus Preisen, Kontextfenster, Output-Limit, Capabilities und Modellnamen abgeleitet.

Nutzer gibt ein:

- Aufgabe: Chat, Coding, RAG, Analyse, Uebersetzung, Vision, Tool-Calling.
- Promptgroesse oder Text.
- Erwartete Output-Tokens.
- Qualitaetsbedarf: guenstig, balanced, best quality.
- Anforderungen: Long Context, Vision, Function Calling, Prompt Caching.

Ausgabe:

- Guenstigste passende Route.
- Balanced Route.
- Premium Route.
- Kurze Begruendung.
- Kostenvergleich fuer die aktuelle Anfrage.
- Warnung, wenn kein Modell richtig passt.

Todos:

- [x] Datenmodell um `category_tags` oder abgeleitete Tags erweitern.
- [x] Recommendation-Regeln definieren.
- [x] UI-Sektion "Best route for this job" bauen.
- [x] Bestehenden Token-Rechner als Input wiederverwenden.
- [x] Kosten fuer cheapest/balanced/premium nebeneinander anzeigen.
- [x] Erklaertext pro Empfehlung knapp halten.

Akzeptanz:

- Ein Nutzer kann ohne Modellwissen eine brauchbare Auswahl treffen.
- Die Empfehlung ist nachvollziehbar und nicht als absolute Wahrheit formuliert.

## P1: Modellfilter und Use-Case-Sichten

Ziel: Die Tabelle soll schnell scanbar und sortierbar werden.

Status: V1 clientseitig umgesetzt. Filter-Tags werden aus vorhandenen Modellfeldern und Modellnamen abgeleitet; echte `category_tags` bleiben optional fuer einen spaeteren Katalogausbau auf 50+ Modelle.

Filter:

- [x] Cheapest input.
- [x] Cheapest output.
- [x] Long context.
- [x] Coding / agentic coding.
- [x] Reasoning / thinking.
- [x] Fast routing / high volume.
- [x] Vision.
- [x] Function calling.
- [x] Open-weight oder open-weight-nahe Anbieter.
- [x] Enterprise RAG.

Sortierung:

- [x] Inputpreis.
- [x] Outputpreis.
- [x] Kontextfenster.
- [x] Cache-read-Kosten.
- [x] Gesamtkosten fuer aktuelle Eingabe.

Akzeptanz:

- Die Liste ist auch bei 18+ Modellen nicht unuebersichtlich.
- Spaetere Erweiterung auf 50+ Modelle bleibt moeglich.

## P2: Vergleichsseiten verbessern

Ziel: Programmatic SEO soll nicht nur Index-Futter sein, sondern echten Entscheidungswert liefern.

Status: V1 im SEO-Generator umgesetzt. Vergleichsseiten enthalten Entscheidungshinweise, Beispielkosten, Capability-/Risiko-Hinweise und interne Links.

Todos:

- [x] Vergleichsseiten um "Nimm A, wenn..." und "Nimm B, wenn..." erweitern.
- [x] Kostenbeispiele fuer 1M, 10M und 100M Tokens anzeigen.
- [x] Kontextfenster- und Output-Limit-Unterschiede staerker hervorheben.
- [x] Risiken anzeigen: Preview, Anbieter, niedrige Kontextfenster, hohe Outputkosten.
- [x] Interne Links zu aehnlichen Modellen ergaenzen.
- [ ] Titel und Meta-Descriptions auf aktuelle Modellnamen optimieren.

Akzeptanz:

- Eine Vergleichsseite beantwortet eine konkrete Modellwahl-Frage.
- SEO-Seiten fuehlen sich nicht wie duenne automatisch generierte Seiten an.

## P2: Kontextfenster-Rechner ausbauen

Ziel: Der Textrechner wird zum echten "passt mein Dokument in welches Modell?"-Werkzeug.

Status: V2 clientseitig umgesetzt. Presets, Fit-Gruppen, Output-Warnungen und One-time-vs-Cached-Kosten sind im Context Calculator sichtbar.

Todos:

- [x] Dokument-/Textlaenge deutlicher als Token-Schaetzung anzeigen.
- [x] Modelle gruppieren nach `fits`, `output cap`, `too large`.
- [x] Kosten fuer einmalige Analyse und wiederholte Analyse mit Cache anzeigen.
- [x] Warnung, wenn Output-Limit fuer Zusammenfassungen knapp wird.
- [x] Beispieltexte oder Presets: Blogpost, PDF, Codebase, Vertrag, CSV-Auswertung.

Akzeptanz:

- Nutzer kann einen langen Text einwerfen und sofort passende Modelle sehen.
- Das Ergebnis ist fuer RAG- und Dokumentenanalyse-Use-Cases nuetzlich.

## P2: Agentic-Web sichtbarer machen

Ziel: `apiroute.dev` soll fuer KI-Agenten als saubere Datenquelle erkennbar sein.

Status: V1 umgesetzt. Die Website hat eine "For AI Agents"-Sektion mit Copy-Buttons, Tool-Beispiel und maschinenlesbarem Best-Route-Guide.

Todos:

- [x] Website-Sektion "For AI Agents" einbauen.
- [x] Copy-Buttons fuer `/api/live-prices`, `/api/models`, `/openapi.yaml`, `/llms.txt`.
- [x] Mini-Beispiel fuer Tool-Registrierung anzeigen.
- [x] `openapi.yaml` um Recommendation-Endpunkt vorbereiten, sobald Best Route existiert.
- [x] In `llms-full.txt` den Recommendation-Use-Case beschreiben.

Akzeptanz:

- Ein Agent muss keine HTML-Tabelle scrapen.
- Ein Entwickler kann die API in unter 2 Minuten testen.

## P2: Marketing- und Demand-Radar besser nutzen

Ziel: Hermes soll bessere Kandidaten fuer manuelle Outreach-Entscheidungen liefern.

Status: V1 umgesetzt. Radar-Queries sind auf aktuelle Modell-/Kostenfragen angepasst, Vorschlaege nutzen den aktuellen Preiskatalog, Source-Ausfaelle erhalten die Queue, und `/api/operator-inbox` liefert eine kompakte Freigabe-Queue fuer das Gravity Control Center.

Todos:

- [x] Radar-Queries auf aktuelle Modellnamen und Kostenprobleme anpassen.
- [x] Alte Referenzen wie GPT-4o/Claude 3.5 in Vorschlaegen vermeiden.
- [x] Fehlerrobustheit verbessern: Bei Reddit-/HN-Ausfall alte Queue nicht leeren.
- [x] Operator-Inbox-Export fuer Gravity Control Center vorbereiten.
- [x] Kandidaten nach Nutzen/Risiko sortieren.
- [x] Keine Auto-Posts, nur Freigabe-Queue.

Akzeptanz:

- Wolfgang bekommt hilfreiche Outreach-Kandidaten, keine Spam-Maschine.
- Fehlerhafte Quellen zerstoeren nicht die bestehende Queue.

## P3: Monetarisierung vorbereiten

Ziel: Umsatzhebel ohne Vertrauensverlust.

Status: V1 umgesetzt. Die Homepage testet Price-Alert-Waitlist, Premium-API-Interesse und klar gekennzeichnete Sponsorship-Anfragen. `/api/commercial-options` beschreibt die Optionen maschinenlesbar und grenzt versteckte Ranking-Kaeufe aus.

Optionen:

- [ ] Affiliate-/Referral-Links pruefen.
- [x] Sponsored Provider Plaetze konzipieren, klar gekennzeichnet.
- [x] Premium API mit Historie, Alerts und hoeherer Aktualitaet skizzieren.
- [x] "Get alerts when model prices change" als Lead-Magnet pruefen.
- [x] E-Mail-Warteliste oder einfaches Interessenformular vorbereiten.
- [x] Pricing-Historie als spaeteren Mehrwert evaluieren.

Akzeptanz:

- Monetarisierung ist sichtbar vorbereitet, aber nicht aufdringlich.
- Die Seite bleibt glaubwuerdig als Vergleichswerkzeug.

## P3: Datenmodell und Skalierung

Ziel: Mehr Modelle aufnehmen, ohne die Seite unwartbar zu machen.

Status: V1 umgesetzt. `scripts/model_catalog.js` ist der zentrale Katalog fuer Aliases, Tags, Gruppen und Missing-Price-Policy. Preise werden mit Tags/Gruppen in `/api/live-prices` geschrieben, `/groups/` wird generiert, und `scripts/validate_data.js` prueft Pflichtmodelle, Preise, Tags, Gruppen und Provider-Zaehlungen.

Todos:

- [x] Modell-Tags zentral im Transformer pflegen.
- [x] Optionales kuratiertes Metadata-Overlay fuer Use-Case-Kategorien anlegen.
- [x] Modellgruppen definieren: frontier, budget, coding, local/open, rag, multimodal.
- [x] Generator so erweitern, dass Seiten nach Gruppen entstehen.
- [x] Testscript fuer Pflichtmodelle und Datenvaliditaet ausbauen.
- [x] Umgang mit fehlenden Preisen definieren: ausblenden, markieren oder separat listen.

Akzeptanz:

- 50+ Modelle bleiben wartbar.
- Fehlende oder kaputte Preise erzeugen keine irrefuehrenden Seiten.

## Nicht jetzt

Diese Punkte sind bewusst spaeter:

- Voller LLM-Gateway / Reverse Proxy.
- Bezahlte Premium-API.
- Login-System.
- Eigene Datenbank.
- Automatisches Social-Media-Posting.
- Komplexe Benchmark-Infrastruktur.

## Empfohlene Umsetzungsreihenfolge

1. Vertrauen und Datenqualitaet sichtbar machen.
2. Model Recommendation / Best Route bauen.
3. Filter und Sortierung fuer die Modellliste.
4. Kontextfenster-Rechner ausbauen.
5. Vergleichsseiten mit echtem Entscheidungswert verbessern.
6. Agentic-Web-Sektion sichtbarer machen.
7. Marketing-Radar an Control Center koppeln.
8. Monetarisierung testen.

## Naechster Startpunkt

Wenn die Umsetzung beginnt, sollte der erste Arbeitsschritt sein:

```text
P1: Datenstand, Quelle und Modellanzahl sichtbar auf der Homepage anzeigen.
```

Das ist klein, risikoarm und erhoeht sofort Vertrauen.
