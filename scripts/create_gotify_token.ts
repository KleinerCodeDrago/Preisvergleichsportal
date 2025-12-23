import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = (process.env.GOTIFY_URL || 'http://localhost:8008').replace(/\/$/, '');
const user = process.env.GOTIFY_DEFAULTUSER_NAME || process.env.GOTIFY_ADMIN_USER || 'admin';
const pass = process.env.GOTIFY_DEFAULTUSER_PASS || process.env.GOTIFY_ADMIN_PASS || 'admin';
const appName = process.env.GOTIFY_APP_NAME || 'preisvergleichsportal';
const outputFile = path.resolve(__dirname, '../.gotify-token');

async function main() {
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  const res = await fetch(`${url}/application`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: appName }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create app failed: ${res.status} ${text}`);
  }

  const data = await res.json() as { token: string; id: number; name: string };
  fs.writeFileSync(outputFile, data.token, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`GoTiFy app created (id=${data.id}, name=${data.name}). Token saved to ${outputFile}`);
  // eslint-disable-next-line no-console
  console.log(`Export for convenience: export GOTIFY_TOKEN=${data.token}`);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
