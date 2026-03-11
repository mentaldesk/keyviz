import type { ErgogenValue } from './types';

export type UnitMap = Map<string, number>;

/**
 * Resolves the units dictionary from an ergogen config.
 * Units may reference other units (e.g. kx: cx + 1), so we resolve iteratively.
 */
export function resolveUnits(raw: Record<string, ErgogenValue>): UnitMap {
	const resolved = new Map<string, number>();
	const pending = new Map(Object.entries(raw));

	let maxPasses = pending.size * 2 + 1;
	while (pending.size > 0 && maxPasses-- > 0) {
		for (const [name, expr] of pending) {
			try {
				resolved.set(name, evalExpression(String(expr), resolved));
				pending.delete(name);
			} catch {
				// not yet resolvable — try again next pass
			}
		}
	}

	if (pending.size > 0) {
		throw new Error(`Could not resolve units: ${[...pending.keys()].join(', ')}`);
	}

	return resolved;
}

/**
 * Evaluates an ergogen expression, substituting known unit names.
 *
 * Handles:
 * - Numeric literals: 19
 * - Unit references: kx
 * - Arithmetic: cx + 1
 * - Prefix multiplier shorthand: 1.5kx → (1.5 * 19), -0.2ky → (-0.2 * 18)
 */
export function evalExpression(expr: string | number, units: UnitMap): number {
	if (typeof expr === 'number') return expr;

	let s = expr.trim();

	// Sort unit names longest-first to avoid partial substitution (e.g. "kx" before "x")
	const names = [...units.keys()].sort((a, b) => b.length - a.length);

	for (const name of names) {
		const val = units.get(name)!;
		// Prefix multiplier: e.g. "1.5kx" or "-0.2ky"
		s = s.replace(
			new RegExp(`(-?\\d+\\.?\\d*)\\s*${name}(?![a-zA-Z_])`, 'g'),
			(_, m) => `(${m} * ${val})`
		);
		// Plain reference (not preceded by a digit or dot)
		s = s.replace(new RegExp(`(?<![\\d.])\\b${name}\\b(?![a-zA-Z_])`, 'g'), String(val));
	}

	// eslint-disable-next-line no-new-func
	return Function(`"use strict"; return (${s});`)() as number;
}
