<script lang="ts">
	import type { KeyPosition } from '$lib/ergogen';

	interface Props {
		keys: KeyPosition[];
		highlightedKeyNames: string[];
		gap?: number;
		padding?: number;
	}

	let { keys, highlightedKeyNames, gap = 1.5, padding = 4 }: Props = $props();

	const highlighted = $derived(new Set(highlightedKeyNames));

	const bbox = $derived.by(() => {
		let bMinX = Infinity,
			bMaxX = -Infinity,
			bMinY = Infinity,
			bMaxY = -Infinity;
		for (const key of keys) {
			const rad = (key.r * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			const hw = key.w / 2;
			const hh = key.h / 2;
			for (const [lx, ly] of [
				[-hw, -hh],
				[hw, -hh],
				[hw, hh],
				[-hw, hh]
			] as [number, number][]) {
				const wx = key.x + lx * cos - ly * sin;
				const wy = key.y + lx * sin + ly * cos;
				bMinX = Math.min(bMinX, wx);
				bMaxX = Math.max(bMaxX, wx);
				bMinY = Math.min(bMinY, wy);
				bMaxY = Math.max(bMaxY, wy);
			}
		}
		return { minX: bMinX - padding, maxX: bMaxX + padding, minY: bMinY - padding, maxY: bMaxY + padding };
	});

	function svgY(y: number): number {
		return bbox.maxY - y;
	}
</script>

<svg
	viewBox="{bbox.minX} 0 {bbox.maxX - bbox.minX} {bbox.maxY - bbox.minY}"
	class="w-full"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each keys as key (key.name)}
		<g transform="translate({key.x},{svgY(key.y)}) rotate({-key.r})">
			<rect
				x={-(key.w / 2) + gap / 2}
				y={-(key.h / 2) + gap / 2}
				width={key.w - gap}
				height={key.h - gap}
				rx="2"
				stroke-width="0.3"
				fill={highlighted.has(key.name) ? 'var(--color-key-held)' : '#d1d5db'}
				stroke={highlighted.has(key.name) ? 'var(--color-key-held)' : '#9ca3af'}
			/>
		</g>
	{/each}
</svg>
