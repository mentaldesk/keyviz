# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server at localhost:5173
pnpm build        # build static site to build/
pnpm preview      # preview the built static site
pnpm check        # type-check (runs svelte-kit sync first)
```

## Architecture

**keyviz** is a SvelteKit static site generator that reads ergogen-format keyboard YAML configs and renders SVG keyboard layout diagrams.

### How it works

1. Keyboard configs live in `src/keyboards/<name>/keys.yaml` (ergogen points syntax)
2. Vite's `import.meta.glob('/src/keyboards/*/keys.yaml', { query: '?raw' })` discovers them at build time
3. SvelteKit prerenderes each keyboard as a static page at `/<name>`
4. The ergogen parser computes key (x, y, r) positions from the YAML; the SVG component renders them

### Key files

- `src/lib/ergogen/` — ergogen parser
  - `units.ts` — resolves unit expressions like `cx + 1` and prefix-multiplier shorthand like `-0.2ky`
  - `parser.ts` — computes `KeyPosition[]` from an `ErgogenConfig`; handles splay geometry, stagger, anchor refs (cross-zone), and property inheritance (global → zone → column → row)
  - `types.ts` — TypeScript interfaces for ergogen YAML and the output `KeyPosition`
- `src/lib/components/KeyboardLayout.svelte` — SVG renderer; takes `KeyPosition[]`, auto-computes viewBox, flips Y-axis (ergogen: up = positive Y; SVG: down = positive Y)
- `src/routes/[keyboard]/+page.ts` — loads and parses a keyboard's YAML at build time; exports `entries()` so SvelteKit knows which routes to prerender
- `src/keyboards/paw/keys.yaml` — example: 5-column split matrix with splay + 2-key thumbfan

### Ergogen geometry

Keys are positioned in mm with Y-up coordinate system. `parser.ts` implements:
- `splay` accumulated per column before placing it (rotates column axis)
- `spread` applied along the column direction vector `(cos r, sin r)`
- `stagger` applied along the perpendicular "up" vector `(-sin r, cos r)`
- `padding` between rows also along the "up" vector (rows go up from bottom)

### Adding a keyboard

Add a directory under `src/keyboards/<name>/` with a `keys.yaml` in ergogen points syntax. It will automatically appear on the home page and get its own route after rebuild.

### Tech stack

- SvelteKit 2 + Svelte 5 (runes syntax), TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite` — no `tailwind.config.js`, just `@import "tailwindcss"` in `app.css`)
- `@sveltejs/adapter-static` — all routes prerendered to `build/`
- `js-yaml` for YAML parsing
