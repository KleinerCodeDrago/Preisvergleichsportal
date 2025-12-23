import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from '../backend/db/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH ?? path.resolve(__dirname, '../preis.db');
const schemaPath = path.resolve(__dirname, '../backend/db/schema.sql');

const db = initDb({ dbPath, schemaPath });

// Create example product
const productRes = db.prepare(`INSERT INTO products (name, image_url) VALUES (?, ?)`).run('Test Product', null);
const productId = Number(productRes.lastInsertRowid);

// Create example source
const sourceRes = db.prepare(
  `INSERT INTO sources (product_id, url, source_type, supports_shipping, active) VALUES (?, ?, ?, ?, ?)`
).run(productId, 'https://example.com', 'shop', 0, 1);
const sourceId = Number(sourceRes.lastInsertRowid);

// Create example location
db.prepare(`INSERT INTO locations (name, postal_code, latitude, longitude, radius_km) VALUES (?, ?, ?, ?, ?)`).run(
  'Berlin Mitte',
  '10115',
  52.52,
  13.405,
  20
);

// eslint-disable-next-line no-console
console.log(`Setup complete. Product ID: ${productId}, Source ID: ${sourceId}`);
// eslint-disable-next-line no-console
console.log(`Database: ${dbPath}`);
