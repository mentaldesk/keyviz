<script lang="ts">
	import type { PageData } from './$types';
	import KeyboardLayout from '$lib/components/KeyboardLayout.svelte';

	let { data }: { data: PageData } = $props();

	let heldKeyName = $state<string | null>(null);

	// Determine which layer the held key activates (must be an &lt binding in the base layer)
	const activeLayerKey = $derived(
		heldKeyName && data.allLayers.BASE?.bindings[heldKeyName]?.holdType === 'layer'
			? data.allLayers.BASE.bindings[heldKeyName].hold!
			: 'BASE'
	);

	const activeEntry = $derived(data.allLayers[activeLayerKey] ?? data.allLayers.BASE);

	$effect(() => {
		const release = () => {
			heldKeyName = null;
		};
		window.addEventListener('mouseup', release);
		return () => window.removeEventListener('mouseup', release);
	});
</script>

<svelte:head>
	<title>{data.keyboard} — Keyviz</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<a href="/" class="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block transition-colors">
		← All keyboards
	</a>

	<h1 class="text-3xl font-bold capitalize mb-8">{data.keyboard}</h1>

	{#if activeEntry}
		<p class="text-center text-sm font-medium text-gray-400 mb-3">{activeEntry.layer.name} Layer</p>
	{/if}
	<div class="bg-gray-900 rounded-2xl p-8 border border-gray-800">
		<KeyboardLayout
			keys={data.keys}
			bindings={activeEntry?.bindings}
			heldKey={heldKeyName ?? undefined}
			onKeyHold={(keyName) => { heldKeyName = keyName; }}
		/>
	</div>
</main>
