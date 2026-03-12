# keyviz

A static site generator for keyboard layout tours. Define your keyboard's physical layout and key bindings in a couple of config files, and keyviz renders an interactive SVG diagram you can share or host anywhere.

## Getting started

```bash
pnpm install
pnpm dev       # dev server at http://localhost:5173
pnpm build     # output static site to build/
pnpm preview   # preview the built site
```

## Adding your keyboard

Create a directory under `src/keyboards/<your-keyboard-name>/`. The name becomes the URL path (e.g. `src/keyboards/myboard/` → `/myboard`).

### 1. Physical layout — `keys.yaml`

Describes the physical position of every key using [ergogen](https://ergogen.cache.works/) points syntax.

```yaml
units:
  cx: 18
  cy: 17
points:
  zones:
    matrix:
      columns:
        pinky:
        ring:
          key:
            stagger: 4
        # ...
      rows:
        bottom:
        home:
        top:
  mirror:
    ref: matrix_pinky_home
    distance: 100
```

See `src/keyboards/paw/keys.yaml` for a complete example with splay, stagger, and mirroring.

### 2. Key bindings — `base.layer` (optional)

Defines the legends shown on each keycap. Uses a simplified subset of [ZMK](https://zmk.dev/) binding syntax.

```
display-name: "Base"
bindings:
   &kp Q   &lt WIN W   &ht SHIFT X  ...
```

**Binding types:**

| Syntax | Behaviour | Example |
|---|---|---|
| `&kp KEY` | Tap sends a keypress | `&kp Q` → sends Q |
| `&lt LAYER KEY` | Hold activates a layer; tap sends a keypress | `&lt WIN W` → hold for WIN layer, tap for W |
| `&ht MOD KEY` | Hold activates a modifier; tap sends a keypress | `&ht SHIFT X` → hold for Shift, tap for X |

**Binding order** matches the visual layout: for each zone (in YAML declaration order), rows are listed top-to-bottom, and within each row the non-mirrored (left) columns come first in YAML order, followed by the mirrored (right) columns in reverse YAML order (so they read left-to-right visually).

See `src/keyboards/paw/base.layer` for a complete example.

## Visual conventions

- **Tap character** — charcoal text, occupies the top two-thirds of the keycap
- **Hold modifier (`&ht`)** — orange text, bottom third
- **Hold layer (`&lt`)** — pink text, bottom third
- **Unbound keys** — rendered in dark gray with no legend

Colors are defined as CSS custom properties in `src/lib/theme.css` and can be changed there:

```css
:root {
  --color-key-bg: #f5f0e8;       /* bone white keycap */
  --color-legend-tap: #110e1f;   /* charcoal */
  --color-legend-hold: #ff811c;  /* orange — hold modifier */
  --color-legend-layer: #a63e6f; /* pink — layer tap */
  --color-key-stroke: #d0c8b8;   /* key border */
}
```

## Project structure

```
src/
  keyboards/
    <name>/
      keys.yaml       ← ergogen points config (required)
      base.layer      ← ZMK-style key bindings (optional)
  lib/
    ergogen/          ← ergogen YAML parser → KeyPosition[]
    layer/            ← .layer file parser and ZMK key display map
    components/
      KeyboardLayout.svelte   ← SVG renderer
    theme.css         ← color custom properties
  routes/
    [keyboard]/       ← one prerendered page per keyboard
```

## Tech stack

- [SvelteKit 2](https://kit.svelte.dev/) + Svelte 5 (runes), TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`@sveltejs/adapter-static`](https://kit.svelte.dev/docs/adapter-static) — fully prerendered, no server required
- [`js-yaml`](https://github.com/nodeca/js-yaml) for YAML parsing
