<script lang="ts">
	import type { KeyPosition } from '$lib/ergogen';
	import type { Binding } from '$lib/layer/types';

	interface Props {
		keys: KeyPosition[];
		bindings?: Record<string, Binding>;
		/** Key name currently being held (rendered green, no legend) */
		heldKey?: string;
		onKeyHold?: (keyName: string) => void;
		/** Visual gap between keys (bezel), in mm */
		gap?: number;
		/** Padding around the layout, in mm */
		padding?: number;
	}

	let { keys, bindings, heldKey, onKeyHold, gap = 1.5, padding = 8 }: Props =
		$props();

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

	function keyFill(key: KeyPosition, binding: Binding | undefined): string {
		if (key.name === heldKey) return 'var(--color-key-held)';
		if (binding && !binding.trans) return 'var(--color-key-bg)';
		return '#374151';
	}

	function keyStroke(key: KeyPosition, binding: Binding | undefined): string {
		if (key.name === heldKey) return 'var(--color-key-held)';
		if (binding && !binding.trans) return 'var(--color-key-stroke)';
		return '#6b7280';
	}
</script>

<svg
	viewBox="{bbox.minX} 0 {viewWidth} {viewHeight}"
	class="w-full h-full"
	xmlns="http://www.w3.org/2000/svg"
	aria-label="Keyboard layout"
>
	{#each keys as key (key.name)}
		{@const binding = bindings?.[key.name]}
		{@const showLegend = binding && !binding.trans && key.name !== heldKey}
		{@const tapY = -(key.h / 2) + gap / 2 + (key.h - gap) / 3}
		{@const holdY = -(key.h / 2) + gap / 2 + (5 * (key.h - gap)) / 6}
		<!--
			Translate to the key's center (with flipped Y), then rotate.
			SVG rotate() is clockwise; ergogen splay is counter-clockwise, so negate.
		-->
		<g
			transform="translate({key.x},{svgY(key.y)}) rotate({-key.r})"
			role="button"
			tabindex="0"
			aria-label={key.name}
			onmousedown={() => onKeyHold?.(key.name)}
			style="cursor: pointer; outline: none"
		>
			<rect
				x={-(key.w / 2) + gap / 2}
				y={-(key.h / 2) + gap / 2}
				width={key.w - gap}
				height={key.h - gap}
				rx="2"
				stroke-width="0.5"
				fill={keyFill(key, binding)}
				stroke={keyStroke(key, binding)}
			/>
			{#if showLegend}
				<text
					x="0"
					y={tapY}
					text-anchor="middle"
					dominant-baseline="central"
					font-size={key.h * 0.35}
					fill="var(--color-legend-tap)"
					font-family="system-ui, sans-serif"
				>
					{binding!.tap}
				</text>
				{#if binding!.hold}
					<text
						x="0"
						y={holdY}
						text-anchor="middle"
						dominant-baseline="central"
						font-size={key.h * 0.22}
						font-family="system-ui, sans-serif"
						fill={binding!.holdType === 'layer'
							? 'var(--color-legend-layer)'
							: 'var(--color-legend-hold)'}
					>
						{binding!.hold}
					</text>
				{/if}
			{/if}
		</g>
	{/each}
</svg>
