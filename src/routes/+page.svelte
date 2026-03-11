<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Keyviz</title>
</svelte:head>

<main class="container mx-auto px-4 py-12">
	<h1 class="text-3xl font-bold mb-2">Keyviz</h1>
	<p class="text-gray-400 mb-8">Keyboard layout tours</p>

	{#if data.keyboards.length === 0}
		<p class="text-gray-500">No keyboards found in src/keyboards/.</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.keyboards as keyboard}
				<a
					href="/{keyboard}"
					class="block bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors border border-gray-800"
				>
					<h2 class="text-xl font-semibold capitalize">{keyboard}</h2>
					<p class="text-gray-500 text-sm mt-1">View layout →</p>
				</a>
			{/each}
		</div>
	{/if}
</main>
