import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import yaml from 'js-yaml';
import { parseErgogenConfig } from '$lib/ergogen';
import type { ErgogenConfig } from '$lib/ergogen';

export const prerender = true;

const yamlFiles = import.meta.glob('/src/keyboards/*/keys.yaml', {
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

	return { keyboard, keys };
};
