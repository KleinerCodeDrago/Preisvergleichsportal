import { PluginDefinition } from './types';

const plugins: PluginDefinition[] = [];

export function registerPlugin(plugin: PluginDefinition) {
    plugins.push(plugin);
}

export function getPlugins(): PluginDefinition[] {
    return plugins;
}
