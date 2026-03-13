<script lang="ts">
	import type { PageData } from './$types';
	import KeyboardLayout from '$lib/components/KeyboardLayout.svelte';
	import ComboPreview from '$lib/components/ComboPreview.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	const embedded = $derived(browser && page.url.searchParams.get('embedded') === 'true');

	let heldKeyName = $state<string | null>(null);
	let hoveredComboKeys = $state<Set<string> | null>(null);
	let heldComboLayer = $state<string | null>(null);
	let selectedLayerKey = $state('BASE');

	// Determine which layer to display — combo &sl takes precedence, then held &lt key, then selected
	const activeLayerKey = $derived(
		heldComboLayer ??
		(heldKeyName && data.allLayers[selectedLayerKey]?.bindings[heldKeyName]?.holdType === 'layer'
			? data.allLayers[selectedLayerKey].bindings[heldKeyName].hold!
			: selectedLayerKey)
	);

	const activeEntry = $derived(data.allLayers[activeLayerKey] ?? data.allLayers.BASE);

	const layerKeys = $derived(
		Object.keys(data.allLayers).sort((a, b) =>
			a === 'BASE' ? -1 : b === 'BASE' ? 1 : a.localeCompare(b)
		)
	);

	const baseCombos = $derived(data.allLayers[selectedLayerKey]?.layer.combos ?? []);

	function comboKeyNames(keyPositions: number[]): string[] {
		return keyPositions.map((i) => data.orderedKeys[i]?.name).filter((n): n is string => !!n);
	}

	$effect(() => {
		const release = () => {
			heldKeyName = null;
			heldComboLayer = null;
		};
		window.addEventListener('mouseup', release);
		return () => window.removeEventListener('mouseup', release);
	});
</script>

<svelte:head>
	<title>{data.keyboard} — Keyviz</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	{#if !embedded}
		<a href="/" class="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block transition-colors">
			← All keyboards
		</a>

		<h1 class="text-3xl font-bold capitalize mb-8">{data.keyboard}</h1>
	{/if}

	{#if layerKeys.length > 0}
		<div class="flex justify-center mb-3">
			<select
				bind:value={selectedLayerKey}
				class="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-500 cursor-pointer"
			>
				{#each layerKeys as layerKey}
					<option value={layerKey}>{data.allLayers[layerKey].layer.name} Layer</option>
				{/each}
			</select>
		</div>
	{/if}
	<div class="bg-gray-900 rounded-2xl p-8 border border-gray-800">
		<KeyboardLayout
			keys={data.keys}
			bindings={activeEntry?.bindings}
			heldKey={heldKeyName ?? undefined}
			highlightedKeys={hoveredComboKeys ?? undefined}
			onKeyHold={(keyName) => { heldKeyName = keyName; }}
		/>
	</div>

	{#if baseCombos.length > 0}
		<section class="mt-6">
			<h2 class="text-lg font-semibold mb-3 text-gray-300">Combos</h2>
			<div class="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
				{#each baseCombos as combo}
					{@const keyNames = comboKeyNames(combo.keyPositions)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="snap-start shrink-0 w-52 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 px-3 pt-2 pb-3 transition-colors cursor-default"
						onmouseenter={() => { hoveredComboKeys = new Set(keyNames); }}
						onmouseleave={() => { hoveredComboKeys = null; }}
						onmousedown={() => { if (combo.activatesLayer) heldComboLayer = combo.activatesLayer; }}
					>
						<p
						class="text-xs font-medium text-center mb-2"
						style:color={combo.activatesLayer ? '#a63e6f' : combo.oneshotMod ? '#ff811c' : undefined}
						class:text-gray-400={!combo.activatesLayer && !combo.oneshotMod}
					>{combo.description}</p>
						<ComboPreview keys={data.keys} highlightedKeyNames={keyNames} />
					</div>
				{/each}
			</div>
		</section>
	{/if}
</main>
