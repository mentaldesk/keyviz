<script lang="ts">
	import type { KeyPosition } from '$lib/ergogen';

	interface Props {
		keys: KeyPosition[];
		/** Visual gap between keys (bezel), in mm */
		gap?: number;
		/** Padding around the layout, in mm */
		padding?: number;
	}

	let { keys, gap = 1.5, padding = 8 }: Props = $props();

	// Bounding box using actual rotated corners of each key (not just centers).
	// This ensures no key is clipped regardless of splay angle.
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

	const viewWidth = $derived(bbox.maxX - bbox.minX);
	const viewHeight = $derived(bbox.maxY - bbox.minY);

	// Ergogen y-axis points up; SVG y-axis points down.
	// Map ergogen y → SVG y: svgY = bbox.maxY - ergogenY
	function svgY(y: number): number {
		return bbox.maxY - y;
	}
</script>

<svg
	viewBox="{bbox.minX} 0 {viewWidth} {viewHeight}"
	class="w-full h-full"
	xmlns="http://www.w3.org/2000/svg"
>
	{#each keys as key (key.name)}
		<!--
			Translate to the key's center (with flipped Y), then rotate.
			SVG rotate() is clockwise; ergogen splay is counter-clockwise, so negate.
		-->
		<g transform="translate({key.x},{svgY(key.y)}) rotate({-key.r})">
			<rect
				x={-(key.w / 2) + gap / 2}
				y={-(key.h / 2) + gap / 2}
				width={key.w - gap}
				height={key.h - gap}
				rx="2"
				ry="2"
				class="fill-gray-700 stroke-gray-500"
				stroke-width="0.5"
			/>
		</g>
	{/each}
</svg>
