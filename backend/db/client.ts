import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export interface DbConfig {
    dbPath: string;
    schemaPath?: string;
}

export interface PriceSnapshotInput {
    sourceId: number;
    priceValueCents: number;
    shippingCents?: number;
    currency?: string;
    isLocal: boolean;
}

export interface LastPrice {
    priceValueCents: number;
    capturedAt: string;
}

export interface ListingInput {
    sourceId: number;
    externalId: string;
    title?: string;
    priceValueCents: number;
    shippingCents?: number;
    currency?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    url?: string;
    isLocal: boolean;
}

export function initDb(config: DbConfig): Database.Database {
    const db = new Database(config.dbPath);
    if (config.schemaPath) {
        const schema = fs.readFileSync(path.resolve(config.schemaPath), 'utf8');
        db.exec(schema);
    }
    db.pragma('journal_mode = WAL');
    return db;
}

export function savePriceSnapshot(db: Database.Database, input: PriceSnapshotInput) {
    const stmt = db.prepare(
        `INSERT INTO price_history (source_id, price_value_cents, shipping_cents, currency, is_local)
         VALUES (@sourceId, @priceValueCents, @shippingCents, @currency, @isLocal)`
    );
    stmt.run({
        sourceId: input.sourceId,
        priceValueCents: input.priceValueCents,
        shippingCents: input.shippingCents ?? 0,
        currency: input.currency ?? 'EUR',
        isLocal: input.isLocal ? 1 : 0,
    });
}

export function getLastPrice(db: Database.Database, sourceId: number): LastPrice | null {
    const row = db.prepare(
        `SELECT price_value_cents as priceValueCents, captured_at as capturedAt
         FROM price_history WHERE source_id = ?
         ORDER BY captured_at DESC LIMIT 1`
    ).get(sourceId) as LastPrice | undefined;
    return row ?? null;
}

export function upsertListing(db: Database.Database, input: ListingInput) {
    const stmt = db.prepare(
        `INSERT INTO listings (source_id, external_id, title, price_value_cents, shipping_cents, currency,
                               latitude, longitude, location_name, url, is_local, first_seen, last_seen)
         VALUES (@sourceId, @externalId, @title, @priceValueCents, @shippingCents, @currency,
                 @latitude, @longitude, @locationName, @url, @isLocal, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT(source_id, external_id) DO UPDATE SET
            title=excluded.title,
            price_value_cents=excluded.price_value_cents,
            shipping_cents=excluded.shipping_cents,
            currency=excluded.currency,
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            location_name=excluded.location_name,
            url=excluded.url,
            is_local=excluded.is_local,
            last_seen=CURRENT_TIMESTAMP`
    );
    stmt.run({
        sourceId: input.sourceId,
        externalId: input.externalId,
        title: input.title ?? null,
        priceValueCents: input.priceValueCents,
        shippingCents: input.shippingCents ?? 0,
        currency: input.currency ?? 'EUR',
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        locationName: input.locationName ?? null,
        url: input.url ?? null,
        isLocal: input.isLocal ? 1 : 0,
    });
}

export function listingExists(db: Database.Database, sourceId: number, externalId: string): boolean {
    const row = db.prepare(
        `SELECT 1 FROM listings WHERE source_id = ? AND external_id = ? LIMIT 1`
    ).get(sourceId, externalId) as { 1: number } | undefined;
    return Boolean(row);
}

export function startCrawlRun(db: Database.Database): number {
    const stmt = db.prepare(`INSERT INTO crawl_runs (status) VALUES ('running')`);
    const res = stmt.run();
    return Number(res.lastInsertRowid);
}

export function finishCrawlRun(db: Database.Database, id: number, status: 'ok' | 'error', error?: string) {
    const stmt = db.prepare(
        `UPDATE crawl_runs SET finished_at=CURRENT_TIMESTAMP, status=@status, error=@error WHERE id=@id`
    );
    stmt.run({ id, status, error: error ?? null });
}
