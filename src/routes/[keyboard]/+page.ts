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

const layerFiles = import.meta.glob('/src/keyboards/*/base.layer', {
	query: '?raw',
	import: 'default'
});

export const entries = () =>
	Object.keys(yamlFiles).map((path) => ({
		keyboard: path.match(/\/src\/keyboards\/([^/]+)\//)?.[1] ?? ''
	}));

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

	let layer: Layer | null = null;
	const bindings: Record<string, Binding> = {};

	const layerLoader = layerFiles[`/src/keyboards/${keyboard}/base.layer`];
	if (layerLoader) {
		const rawLayer = (await layerLoader()) as string;
		layer = parseLayer(rawLayer);
		const orderedKeys = getBindingOrder(keys, config);
		orderedKeys.forEach((key, i) => {
			if (layer!.bindings[i]) bindings[key.name] = layer!.bindings[i];
		});
	}

	return { keyboard, keys, layer, bindings };
};
