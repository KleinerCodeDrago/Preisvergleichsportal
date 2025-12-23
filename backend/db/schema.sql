-- Schema for Preisvergleichsportal (SQLite)
-- Products and sources
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('shop','marketplace','classified')),
    title TEXT,
    supports_shipping INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Locations and radii
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    postal_code TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_km REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Price snapshots
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    price_value_cents INTEGER NOT NULL,
    shipping_cents INTEGER DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    is_local INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- Listings for marketplaces/classifieds (to track new/known offers)
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT,
    price_value_cents INTEGER NOT NULL,
    shipping_cents INTEGER DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'EUR',
    latitude REAL,
    longitude REAL,
    location_name TEXT,
    url TEXT,
    first_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_local INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
    UNIQUE(source_id, external_id)
);

-- Device tokens for GoTiFy
CREATE TABLE IF NOT EXISTS gotify_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token)
);

-- Crawl runs for logging
CREATE TABLE IF NOT EXISTS crawl_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at DATETIME,
    status TEXT NOT NULL DEFAULT 'running',
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sources_product ON sources(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_source ON price_history(source_id, captured_at);
CREATE INDEX IF NOT EXISTS idx_listings_source ON listings(source_id, last_seen);
CREATE INDEX IF NOT EXISTS idx_listings_external ON listings(source_id, external_id);
