import { registerPlugin } from './registry';
import { makeCssPricePlugin } from './examples/css_selector_plugin';
import { PluginDefinition } from './types';

export function loadDefaultPlugins(): PluginDefinition[] {
    const defaults: PluginDefinition[] = [
        makeCssPricePlugin({
            id: 'example-demo',
            label: 'Example Demo (CSS)',
            sourceType: 'shop',
            urlPattern: /example\.com/,
            priceSelector: 'h1',
            shippingSelector: undefined,
        }),
        makeCssPricePlugin({
            id: 'paperless-css',
            label: 'Paperless Paper (CSS)',
            sourceType: 'shop',
            urlPattern: /paperlesspaper\.com/,
            priceSelector: '.product-price',
            shippingSelector: undefined,
        }),
    ];
    defaults.forEach(registerPlugin);
    return defaults;
}
