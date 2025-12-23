# Preisvergleichsportal

Multi-Source-Preisbeobachtung für Shops, Marktplätze und Kleinanzeigen mit täglichem Scraping, lokaler/überregionaler Klassifikation und GoTiFy-Push-Benachrichtigungen.

## Features

- 🔍 **Flexible Scraper**: Playwright-basiertes Scraping mit Plugin-System für beliebige Shops
- 📍 **Geo-Filtering**: Orte mit Radius definieren → lokale Angebote (ohne Versand) vs. überregionale (mit Versand)
- 📊 **Preisverlauf**: SQLite-basierte Speicherung aller Preise für historische Analysen
- 🔔 **Push-Benachrichtigungen**: GoTiFy-Integration für neue Inserate oder Preisfälle
- 🕐 **Tägliche Updates**: Automatischer Crawler-Job für alle Produkte/Quellen
- 🧩 **Plugin-System**: CSS-Selector-basierte Plugins ohne Codeänderung erweiterbar

## Quick Start

### 1. Installation
```bash
npm install
npx playwright install chromium
```

### 2. GoTiFy starten & Token erstellen
```bash
npm run gotify:up
npm run gotify:token
```

### 3. Test-Daten anlegen
```bash
npm run setup
```

### 4. Daily-Job ausführen
```bash
export GOTIFY_URL=http://localhost:8008
export GOTIFY_TOKEN=$(cat .gotify-token)
npm run run:daily
```

GoTiFy-UI: http://localhost:8008 (Login: admin/admin)

### 5. API + Frontend starten
```bash
npm run dev:server
```
Öffne dann http://localhost:3000 (UI lädt Daten über die API).

## Verfügbare Skripte

- `npm run setup` — Erstellt DB + Test-Produkt/Source
- `npm run run:daily` — Führt täglichen Scraper-Job aus
- `npm run gotify:up` — Startet GoTiFy-Container
- `npm run gotify:down` — Stoppt GoTiFy-Container
- `npm run gotify:token` — Erstellt GoTiFy-App-Token
- `npm run dev:server` — Startet API + statisches Frontend

## Projekt-Struktur

```
backend/
  db/          # SQLite Schema + Client
  jobs/        # Daily-Crawler-Job
  notifications/ # GoTiFy-Integration
  plugins/     # Plugin-Registry + Beispiele (CSS-Selector)
  scraper/     # Playwright-Client
  utils/       # Geo-Helfer (Haversine, isLocal)
scripts/       # CLI-Tools (setup, run_daily, create_gotify_token)
docs/          # Agent-Instructions
```

## Nächste Schritte

- [ ] Web-UI für Produkt-/Quellen-/Ortsverwaltung
- [ ] API-Backend (Express/Fastify)
- [ ] Preisverlauf-Grafiken
- [ ] Marktplatz-/Kleinanzeigen-Parser (Ebay, Kleinanzeigen)
- [ ] Cronjob/Systemd-Timer für automatische tägliche Läufe