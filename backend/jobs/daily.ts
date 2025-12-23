import { getPlugins } from '../plugins/registry';
import { loadDefaultPlugins } from '../plugins/init';
import { PluginDefinition } from '../plugins/types';
import { isLocal } from '../utils/geo';
import {
    initDb,
    savePriceSnapshot,
    upsertListing,
    getLastPrice,
    listingExists,
    startCrawlRun,
    finishCrawlRun,
} from '../db/client';
import { sendGotify, GotifyConfig } from '../notifications/gotify';

interface Target {
    url: string;
    sourceId: number;
    sourceType: 'shop' | 'marketplace' | 'classified';
    locations: { latitude: number; longitude: number; radiusKm: number }[];
}

interface RunOptions {
    targets: Target[];
    db: { dbPath: string; schemaPath?: string };
    gotify?: GotifyConfig;
}

export async function runDailyJob(options: RunOptions) {
    const { targets, db: dbConfig, gotify } = options;
    const db = initDb(dbConfig);
    const crawlId = startCrawlRun(db);
    if (getPlugins().length === 0) {
        loadDefaultPlugins();
    }
    const plugins: PluginDefinition[] = getPlugins();
    try {
        for (const target of targets) {
            const plugin = plugins.find(p => p.match(target.url));
            if (!plugin) continue;
            const result = await plugin.scrape(target.url, { userAgent: defaultUA });
            for (const offer of result.offers) {
                const local = isLocal(target.locations, offer);

                if (target.sourceType === 'marketplace' || target.sourceType === 'classified') {
                    const externalId = offer.externalId || offer.url || `${target.url}#${offer.title ?? ''}`;
                    const existed = listingExists(db, target.sourceId, externalId);
                    upsertListing(db, {
                        sourceId: target.sourceId,
                        externalId,
                        title: offer.title,
                        priceValueCents: offer.priceValueCents,
                        shippingCents: offer.shippingCents ?? 0,
                        currency: offer.currency ?? 'EUR',
                        latitude: offer.latitude,
                        longitude: offer.longitude,
                        locationName: undefined,
                        url: offer.url,
                        isLocal: local,
                    });
                    if (!existed && gotify) {
                        await safeNotify(gotify, 'Neues Inserat', `${offer.title ?? target.url} für ${(offer.priceValueCents / 100).toFixed(2)}€`);
                    }
                } else {
                    const last = getLastPrice(db, target.sourceId);
                    savePriceSnapshot(db, {
                        sourceId: target.sourceId,
                        priceValueCents: offer.priceValueCents,
                        shippingCents: offer.shippingCents ?? 0,
                        currency: offer.currency ?? 'EUR',
                        isLocal: local,
                    });
                    const cheaper = last ? offer.priceValueCents < last.priceValueCents : true;
                    if (cheaper && gotify) {
                        await safeNotify(
                            gotify,
                            'Preis gefallen',
                            `${target.url} jetzt ${(offer.priceValueCents / 100).toFixed(2)}€${local ? ' (lokal)' : ''}`
                        );
                    }
                }
            }
        }
        finishCrawlRun(db, crawlId, 'ok');
    } catch (err) {
        finishCrawlRun(db, crawlId, 'error', err instanceof Error ? err.message : String(err));
        throw err;
    }
}

const defaultUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

async function safeNotify(cfg: GotifyConfig, title: string, msg: string) {
    try {
        await sendGotify(cfg, title, msg);
    } catch (err) {
        // best-effort: log to console for now
        // eslint-disable-next-line no-console
        console.error('GoTiFy notify failed', err);
    }
}
