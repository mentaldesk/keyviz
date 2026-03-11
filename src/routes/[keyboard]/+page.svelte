<script lang="ts">
	import type { PageData } from './$types';
	import KeyboardLayout from '$lib/components/KeyboardLayout.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.keyboard} — Keyviz</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<a href="/" class="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-block transition-colors">
		← All keyboards
	</a>

	<h1 class="text-3xl font-bold capitalize mb-8">{data.keyboard}</h1>

	<div class="bg-gray-900 rounded-2xl p-8 border border-gray-800">
		<KeyboardLayout keys={data.keys} />
	</div>
</main>
