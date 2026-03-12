import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import yaml from 'js-yaml';
import { parseErgogenConfig } from '$lib/ergogen';
import type { ErgogenConfig } from '$lib/ergogen';
import { parseLayer } from '$lib/layer/parser';
import { getBindingOrder } from '$lib/layer/keymap';
import type { Layer, Binding } from '$lib/layer/types';

export const prerender = true;

const yamlFiles = import.meta.glob('/src/keyboards/*/keys.yaml', {
	query: '?raw',
	import: 'default'
});

const layerFiles = import.meta.glob('/src/keyboards/*/*.layer', {
	query: '?raw',
	import: 'default'
});

export const entries = () =>
	Object.keys(yamlFiles).map((path) => ({
		keyboard: path.match(/\/src\/keyboards\/([^/]+)\//)?.[1] ?? ''
	}));

export interface LayerEntry {
	layer: Layer;
	bindings: Record<string, Binding>;
}

export const load: PageLoad = async ({ params }) => {
	const { keyboard } = params;
	const filePath = `/src/keyboards/${keyboard}/keys.yaml`;

	const loader = yamlFiles[filePath];
	if (!loader) {
		throw error(404, `Keyboard "${keyboard}" not found`);
	}

	const rawYaml = (await loader()) as string;
	const config = yaml.load(rawYaml) as ErgogenConfig;

	let keys;
	try {
		keys = parseErgogenConfig(config);
	} catch (e) {
		throw error(500, `Failed to parse keyboard config: ${e}`);
	}

	const orderedKeys = getBindingOrder(keys, config);
	const allLayers: Record<string, LayerEntry> = {};

	for (const [path, layerLoader] of Object.entries(layerFiles)) {
		const match = path.match(/\/src\/keyboards\/([^/]+)\/([^/]+)\.layer$/);
		if (!match || match[1] !== keyboard) continue;

		const layerKey = match[2].toUpperCase(); // 'base' → 'BASE', 'brac' → 'BRAC'
		const rawLayer = (await layerLoader()) as string;
		const layer = parseLayer(rawLayer);
		const bindings: Record<string, Binding> = {};
		orderedKeys.forEach((key, i) => {
			if (layer.bindings[i]) bindings[key.name] = layer.bindings[i];
		});
		allLayers[layerKey] = { layer, bindings };
	}

	return { keyboard, keys, allLayers };
};
