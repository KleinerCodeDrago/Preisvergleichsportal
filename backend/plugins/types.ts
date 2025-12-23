export type SourceType = 'shop' | 'marketplace' | 'classified';

export interface PluginContext {
    userAgent: string;
    timeoutMs?: number;
    locale?: string;
}

export interface ExtractedOffer {
    externalId?: string; // for listings/marketplaces
    title?: string;
    priceValueCents: number;
    shippingCents?: number;
    currency?: string;
    url?: string;
    latitude?: number;
    longitude?: number;
}

export interface PluginResult {
    offers: ExtractedOffer[];
    supportsShipping: boolean;
}

export interface PluginDefinition {
    id: string;
    label: string;
    sourceType: SourceType;
    match: (url: string) => boolean;
    scrape: (url: string, ctx: PluginContext) => Promise<PluginResult>;
}
