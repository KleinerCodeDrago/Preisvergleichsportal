import { PluginDefinition, PluginResult } from '../types';
import { PlaywrightClient } from '../../scraper/playwright_client';

interface CssPluginOptions {
    id: string;
    label: string;
    sourceType: 'shop' | 'marketplace' | 'classified';
    urlPattern: RegExp;
    priceSelector: string;
    shippingSelector?: string;
}

function parsePriceToCents(raw: string | undefined): number {
    if (!raw) return 0;
    const cleaned = raw.replace(/\s+/g, '').replace(/[^0-9,\.]/g, '').replace(',', '.');
    const value = Number.parseFloat(cleaned);
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

export function makeCssPricePlugin(opts: CssPluginOptions): PluginDefinition {
    return {
        id: opts.id,
        label: opts.label,
        sourceType: opts.sourceType,
        match: (url: string) => opts.urlPattern.test(url),
        scrape: async (url, ctx): Promise<PluginResult> => {
            const client = new PlaywrightClient();
            try {
                const page = await client.fetchPage(url, {
                    userAgent: ctx.userAgent,
                    timeoutMs: ctx.timeoutMs,
                    headless: true,
                });
                const priceText = await page.$eval(opts.priceSelector, el => el.textContent || '');
                const shippingText = opts.shippingSelector
                    ? await page.$eval(opts.shippingSelector, el => el.textContent || '')
                    : undefined;
                const priceValueCents = parsePriceToCents(priceText);
                const shippingCents = opts.shippingSelector ? parsePriceToCents(shippingText) : 0;
                await page.context().close();
                return {
                    offers: [
                        {
                            priceValueCents,
                            shippingCents,
                            currency: 'EUR',
                            url,
                        },
                    ],
                    supportsShipping: Boolean(opts.shippingSelector),
                };
            } finally {
                await client.close();
            }
        },
    };
}
