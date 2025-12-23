# Agent Instructions

Purpose: This file tells the coding agent exactly what to build for the Preisvergleichsportal MVP.

## Core Goals
- Preisbeobachter für viele Quellen, inkl. Shops, Marktplätze und Kleinanzeigen.
- Neue Quellen müssen per Regel/Plugin nachrüstbar sein (Selektoren/Extraktion ohne Codeänderung).
- Täglicher Abruf aller Quellen, Speicherung der Preisverläufe in SQLite.
- Klassifikation lokaler vs. überregionaler Angebote mit Ortsradius.
- Benachrichtigungen ausschließlich via GoTiFy an mehrere Geräte.
- Responsive Web-App (Desktop + Android) mit voller Funktionalität.
- Lauf in kleiner lokaler VM, Headless mit Playwright.

## Technical Decisions (fixed)
- Datenbank: SQLite, lokal persistiert.
- Scheduler: einmal täglich global für alle Produkte/Quellen (kein dynamisches Intervall).
- Headless: Playwright (Chromium), Anti-Scraping-Bypass erlaubt. Läuft in lokaler Mini-VM/Docker.
- Benachrichtigungen: nur GoTiFy, mehrere Device-Tokens, kein E-Mail, kein Browser-Push, keine native App.
- Produktanlage: manuell durch Nutzer (Name, Bild optional, mehrere Quellen-URLs). Kein automatisches Matching.
- Preislogik: lokal = Preis ohne Versand; überregional = Preis + Versand; günstigste Ergebnisse je Klasse speichern.
- Geografie: mehrere Orte mit PLZ/Geo + Radius. Angebote innerhalb Radius gelten als lokal (Versand ignorieren), außerhalb als überregional.
- Historie: Preisverläufe speichern (mindestens täglich). Grafische Darstellung in der UI vorgesehen.

## Required Modules
1) Datenmodell & Storage: Tabellen für Produkte, Quellen (Typ: Shop/Marktplatz/Kleinanzeige), Preise/Verlauf, Orte, GoTiFy-Geräte, Crawl-Jobs/Logs.
2) Scraper-Kern: Playwright-Wrapper mit Timeout/Retry/Logging, rendert JS, liefert DOM/HTML. Einfacher Anti-Bot-Bypass erlaubt.
3) Plugin-System: Laufzeitladbare Regeln (URL-Muster, Selektoren/Extraktion für Preis & Versand, evtl. Währung). Ziel: neue Quellen ohne Codeänderung.
4) Marktplatz/Kleinanzeigen-Parser: Listenextraktion, Felder Preis, Versand, Standort, Link; Distanzberechnung zu allen Orten; Kennzeichnung neu/bekannt.
5) Preislogik & Klassifikation: Bestpreis lokal (ohne Versand) und überregional (inkl. Versand) ermitteln, Speicherung + Verlauf.
6) Scheduler: täglicher Full-Run über alle Produkte/Quellen; robust gegen Teilausfälle; Fehler loggen, Lauf nicht abbrechen.
7) Benachrichtigungen: GoTiFy-Client; Trigger bei neuen Inseraten oder Preisfall ggü. letztem bekannten Preis; Versand an alle Tokens.
8) Web UI: responsive, zeigt Produkte, Preise, lokal/überregional, Preisverlauf-Grafik; erlaubt Orte+Radius, Quellen anlegen, Tokens pflegen.
9) Deployment: Startskript für Mini-VM (Playwright deps, SQLite Schema init, Backend+Frontend starten); Logs leicht zugänglich; einfache Updates.

## Non-Goals (MVP)
- Keine iOS-/macOS-Pushes, keine Browser-Pushes, keine E-Mail-Benachrichtigungen.
- Keine Multi-User-/Rechtesysteme; Single-User-Instanz.
- Keine kostenpflichtigen APIs; wenn Kosten anfallen, wird gescrapt.
- Kein automatisches Produkt-Matching, nur manuelle Zuordnung.

## Open Implementation Notes for the Agent
- Be conservative mit Playwright-Ressourcen (Headless, re-use browser contexts wo möglich).
- Distanzberechnung kann zunächst einfache Haversine-Funktion sein; Orte per PLZ/Koordinate + Radius.
- Preisverlauf zunächst ungefiltert speichern (mind. ein Messpunkt pro Tageslauf); spätere Verdichtung optional.
- GoTiFy: Token-Speicher, schlanke Message-Payload (z. B. Produktname, Preis, Link, lokal/überregional).
- UX: einfache responsive Layouts, aber Preisverlauf-Grafik einplanen (z. B. mit lightweight Chart-Lib).
- Tests: Fokus auf Parser/Plugin-Einheiten und Preislogik.

## Next Suggested Steps
- Schema-Entwurf in `backend/db/schema.sql` und Migrationsskript anlegen.
- Playwright-Scraper-Grundmodul skizzieren (`backend/scraper/playwright_client.ts` o. ä.).
- Plugin-Interface definieren (`backend/plugins/types.ts`) und Beispiel-Plugin hinzufügen.
- Grobes Frontend-Gerüst mit Routing und einfachem Produkt- und Quellen-Formular erstellen.
- Täglichen Scheduler-Entry-Point anlegen (`backend/jobs/daily.ts`).
- GoTiFy-Server kann als Sidecar gemeinsam mit der App in der Mini-VM laufen; Integration erfolgt nach MVP-Grundgerüst.
