import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { initDb } from './db/client';
import type { Database } from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH ?? path.resolve(__dirname, '../preis.db');
const schemaPath = path.resolve(__dirname, './db/schema.sql');
const publicDir = path.resolve(__dirname, '../public');
const PORT = Number(process.env.PORT || 3000);

const db: Database = initDb({ dbPath, schemaPath });
const app = Fastify({ logger: true });

app.get('/api/health', async () => ({ status: 'ok' }));

app.get('/api/products', async () => {
    const products = db.prepare('SELECT id, name, image_url as imageUrl FROM products ORDER BY id DESC').all();
    const sourcesStmt = db.prepare(`
        SELECT s.id, s.url, s.source_type as sourceType, s.supports_shipping as supportsShipping, s.active,
               ph.price_value_cents as lastPriceCents, ph.shipping_cents as lastShippingCents,
               ph.is_local as lastIsLocal, ph.captured_at as lastCapturedAt
        FROM sources s
        LEFT JOIN price_history ph ON ph.source_id = s.id
          AND ph.captured_at = (
              SELECT captured_at FROM price_history WHERE source_id = s.id ORDER BY captured_at DESC LIMIT 1
          )
        WHERE s.product_id = ?
        ORDER BY s.id DESC
    `);

    const result = products.map((p: any) => {
        const sources = sourcesStmt.all(p.id);
        return { ...p, sources };
    });
    return { products: result };
});

app.post('/api/products', async (req, reply) => {
    const body = req.body as { name?: string; imageUrl?: string };
    if (!body.name) {
        reply.code(400); return { error: 'name required' };
    }
    const res = db.prepare('INSERT INTO products (name, image_url) VALUES (?, ?)').run(body.name, body.imageUrl ?? null);
    return { id: Number(res.lastInsertRowid) };
});

app.post('/api/sources', async (req, reply) => {
    const body = req.body as {
        productId?: number;
        url?: string;
        sourceType?: 'shop' | 'marketplace' | 'classified';
        supportsShipping?: boolean;
        active?: boolean;
    };
    if (!body.productId || !body.url || !body.sourceType) {
        reply.code(400); return { error: 'productId, url, sourceType required' };
    }
    const res = db.prepare(
        `INSERT INTO sources (product_id, url, source_type, supports_shipping, active) VALUES (?, ?, ?, ?, ?)`
    ).run(body.productId, body.url, body.sourceType, body.supportsShipping ? 1 : 0, body.active === false ? 0 : 1);
    return { id: Number(res.lastInsertRowid) };
});

app.get('/api/locations', async () => {
    const rows = db.prepare(
        'SELECT id, name, postal_code as postalCode, latitude, longitude, radius_km as radiusKm FROM locations ORDER BY id DESC'
    ).all();
    return { locations: rows };
});

app.post('/api/locations', async (req, reply) => {
    const body = req.body as {
        name?: string;
        postalCode?: string;
        latitude?: number;
        longitude?: number;
        radiusKm?: number;
    };
    if (body.latitude == null || body.longitude == null || body.radiusKm == null) {
        reply.code(400); return { error: 'latitude, longitude, radiusKm required' };
    }
    const res = db.prepare(
        `INSERT INTO locations (name, postal_code, latitude, longitude, radius_km) VALUES (?, ?, ?, ?, ?)`
    ).run(body.name ?? null, body.postalCode ?? null, body.latitude, body.longitude, body.radiusKm);
    return { id: Number(res.lastInsertRowid) };
});

app.get('/api/price-history/:sourceId', async (req, reply) => {
    const params = req.params as { sourceId?: string };
    const sourceId = Number(params.sourceId);
    if (!sourceId) {
        reply.code(400); return { error: 'invalid sourceId' };
    }
    const rows = db.prepare(
        `SELECT price_value_cents as priceValueCents, shipping_cents as shippingCents, currency, is_local as isLocal, captured_at as capturedAt
         FROM price_history WHERE source_id = ? ORDER BY captured_at DESC LIMIT 50`
    ).all(sourceId);
    return { history: rows };
});

app.register(fastifyStatic, {
    root: publicDir,
    prefix: '/',
});

app.setNotFoundHandler((req, reply) => {
    if (req.raw.url && !req.raw.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
    }
    reply.code(404).send({ error: 'Not found' });
});

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
});
