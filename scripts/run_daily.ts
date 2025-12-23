import path from 'path';
import { fileURLToPath } from 'url';
import { runDailyJob } from '../backend/jobs/daily';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH ?? path.resolve(__dirname, '../preis.db');
const schemaPath = path.resolve(__dirname, '../backend/db/schema.sql');
const gotifyUrl = process.env.GOTIFY_URL;
const gotifyToken = process.env.GOTIFY_TOKEN;

const gotifyConfig = gotifyUrl && gotifyToken ? { url: gotifyUrl, token: gotifyToken } : undefined;

// TODO: Replace with real products/sources from DB. Keep sourceId/sourceType in sync with DB entries.
const targets = [
  {
    sourceId: 1,
    sourceType: 'shop' as const,
    url: 'https://example.com',
    locations: [
      { latitude: 52.52, longitude: 13.405, radiusKm: 20 }, // Berlin sample radius
    ],
  },
];

async function main() {
  await runDailyJob({
    db: { dbPath, schemaPath },
    gotify: gotifyConfig,
    targets,
  });
  // eslint-disable-next-line no-console
  console.log('Daily run finished');
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Daily run failed', err);
  process.exit(1);
});
