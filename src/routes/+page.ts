import type { PageLoad } from './$types';

export const prerender = true;

const yamlFiles = import.meta.glob('/src/keyboards/*/keys.yaml', {
	query: '?raw',
	import: 'default'
});

export const load: PageLoad = () => {
	const keyboards = Object.keys(yamlFiles)
		.map((path) => path.match(/\/src\/keyboards\/([^/]+)\/keys\.yaml$/)?.[1])
		.filter((name): name is string => Boolean(name));

	return { keyboards };
};
