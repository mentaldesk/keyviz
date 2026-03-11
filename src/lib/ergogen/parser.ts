import type { ErgogenConfig, ErgogenKeyProps, KeyPosition, ErgogenValue } from './types';
import { resolveUnits, evalExpression, type UnitMap } from './units';

const DEFAULT_SPREAD = 19;
const DEFAULT_PADDING = 19;
const DEFAULT_KEY_W = 18;
const DEFAULT_KEY_H = 17;

function mergeKeyProps(
	...layers: (ErgogenKeyProps | null | undefined)[]
): ErgogenKeyProps {
	const result: ErgogenKeyProps = {};
	for (const layer of layers) {
		if (layer) Object.assign(result, layer);
	}
	return result;
}

function resolveVal(
	val: ErgogenValue | undefined,
	fallback: number,
	units: UnitMap
): number {
	if (val === undefined || val === null) return fallback;
	return evalExpression(val, units);
}

/**
 * Parses an ergogen config and returns computed key positions.
 *
 * Geometry (all in mm, y-axis points up as in ergogen):
 * - spread: applied along column direction (cos r, sin r)
 * - stagger: applied along column "up" direction (-sin r, cos r)
 * - splay: accumulated rotation, applied before placing each column
 * - padding: row spacing, also along the column "up" direction
 */
export function parseErgogenConfig(config: ErgogenConfig): KeyPosition[] {
	const units: UnitMap = config.units
		? resolveUnits(config.units as Record<string, number | string>)
		: new Map();

	// Default key size: use cx/cy units if available, else fallback constants
	const defaultW = units.has('cx') ? units.get('cx')! : DEFAULT_KEY_W;
	const defaultH = units.has('cy') ? units.get('cy')! : DEFAULT_KEY_H;

	const keysByName = new Map<string, KeyPosition>();
	const allKeys: KeyPosition[] = [];

	const zones = config.points?.zones ?? {};

	for (const [zoneName, zone] of Object.entries(zones)) {
		if (!zone) continue;

		// Resolve anchor for this zone
		let anchorX = 0;
		let anchorY = 0;
		let anchorR = 0;

		if (zone.anchor) {
			const anchor = zone.anchor;
			if (anchor.ref) {
				const refKey = keysByName.get(anchor.ref);
				if (!refKey) {
					throw new Error(
						`Zone "${zoneName}" anchor ref "${anchor.ref}" not found. ` +
							`Ensure zones are ordered so referenced keys are computed first.`
					);
				}
				anchorX = refKey.x;
				anchorY = refKey.y;
				anchorR = refKey.r;
			}
			if (anchor.shift) {
				const [sx, sy] = anchor.shift;
				anchorX += resolveVal(sx, 0, units);
				anchorY += resolveVal(sy, 0, units);
			}
			if (anchor.rotate !== undefined) {
				anchorR += resolveVal(anchor.rotate, 0, units);
			}
		}

		const zoneKeyProps = zone.key ?? {};
		const columnEntries = Object.entries(zone.columns ?? {});
		const rowEntries = Object.entries(zone.rows ?? {});

		// Track accumulated position and rotation across columns
		let curX = anchorX;
		let curY = anchorY;
		let curR = anchorR;
		let firstCol = true;

		for (const [colName, colDef] of columnEntries) {
			const colKeyProps = colDef?.key ?? {};

			// Merge zone → column for layout properties
			const effective = mergeKeyProps(zoneKeyProps, colKeyProps);

			const spread = resolveVal(effective.spread, DEFAULT_SPREAD, units);
			const stagger = resolveVal(effective.stagger, 0, units);
			const splay = resolveVal(effective.splay, 0, units);

			// Splay is applied before placing this column
			curR += splay;

			if (!firstCol) {
				const rad = (curR * Math.PI) / 180;
				// Spread is along column direction; stagger is perpendicular ("up")
				curX += spread * Math.cos(rad) + stagger * -Math.sin(rad);
				curY += spread * Math.sin(rad) + stagger * Math.cos(rad);
			}
			firstCol = false;

			for (let ri = 0; ri < rowEntries.length; ri++) {
				const [rowName, rowDef] = rowEntries[ri];
				const rowKeyProps = rowDef?.key ?? {};

				const merged = mergeKeyProps(zoneKeyProps, colKeyProps, rowKeyProps);

				const padding = resolveVal(merged.padding, DEFAULT_PADDING, units);
				const w = resolveVal(merged.width, defaultW, units);
				const h = resolveVal(merged.height, defaultH, units);

				const rad = (curR * Math.PI) / 180;
				// Rows go "up" in the column's local frame: along (-sin r, cos r)
				const keyX = curX + ri * padding * -Math.sin(rad);
				const keyY = curY + ri * padding * Math.cos(rad);

				const key: KeyPosition = {
					name: `${zoneName}_${colName}_${rowName}`,
					x: keyX,
					y: keyY,
					r: curR,
					w,
					h,
					zone: zoneName,
					col: colName,
					row: rowName
				};

				keysByName.set(key.name, key);
				allKeys.push(key);
			}
		}
	}

	// Mirror: skip silently if the ref key doesn't exist
	if (config.points.mirror) {
		const { ref, distance } = config.points.mirror;
		const refKey = keysByName.get(ref);
		if (!refKey) {
			console.warn(`Mirror ref "${ref}" not found — skipping mirror`);
		} else {
			const dist = resolveVal(distance, 0, units);
			const mirrorLineX = refKey.x + dist / 2;
			const mirroredKeys: KeyPosition[] = allKeys.map((key) => ({
				...key,
				name: `mirror_${key.name}`,
				x: 2 * mirrorLineX - key.x,
				r: -key.r,
				mirrored: true
			}));
			allKeys.push(...mirroredKeys);
		}
	}

	return allKeys;
}
