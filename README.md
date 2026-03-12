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

| Syntax | Behaviour | Rendered as |
|---|---|---|
| `&kp KEY` | Tap sends a keypress | Tap character, top ⅔ of keycap, charcoal |
| `&lt LAYER KEY` | Hold activates a layer; tap sends a keypress | Tap character (top ⅔) + layer name (bottom ⅓, pink) |
| `&ht MOD KEY` | Hold activates a modifier; tap sends a keypress | Tap character (top ⅔) + modifier name (bottom ⅓, orange) |
| `&trans` | Transparent — passes through to the layer below | Gray keycap, no legend |
| `&ok description` | OS/app command; description uses `_` in place of spaces | Blue description text, word-wrapped across lines |
| `&bt 0`/`&bt 1`/`&bt 2` | Switch to Bluetooth channel | Bluetooth symbol + channel number |
| `&bt BT_CLR` | Clear Bluetooth pairing | Bluetooth symbol + "CLR" |
| `&os_sel MAC`/`WIN`/`LIN` | Select OS (affects modifier behaviour) | Apple / Windows / Linux icon |

**ZMK key names** — single characters (letters, digits) render as-is. Common aliases like `EXCL`, `AMPS`, `CARET`, `BSPC`, `RET`, `SPACE`, `UP` etc. are mapped to their display characters. See `src/lib/layer/keymap.ts` for the full list.

**Binding order** matches the visual layout: for each zone (in YAML declaration order), rows are listed top-to-bottom, and within each row the non-mirrored (left) columns come first in YAML order, followed by the mirrored (right) columns in reverse YAML order (so they read left-to-right visually).

See `src/keyboards/paw/` for complete examples of all binding types.

## Interactive layer switching

Mousedown on a key with an `&lt LAYER` binding switches the display to that layer. The held key is highlighted in green. Releasing the mouse anywhere returns to the base layer.

Keys showing `&trans` in the active layer are rendered gray (they fall through to the layer below and don't do anything special on the current layer).

## Visual conventions

- **Tap character** (`&kp`) — charcoal, top two-thirds of keycap
- **Hold modifier** (`&ht`) — orange, bottom third
- **Hold layer** (`&lt`) — pink, bottom third
- **Command** (`&ok`) — blue, centered and word-wrapped
- **Transparent** (`&trans`) — dark gray, no legend
- **Held key** — green background, no legend

Colors are defined as CSS custom properties in `src/lib/theme.css` and can be changed there:

```css
:root {
  --color-key-bg: #f5f0e8;         /* bone white keycap */
  --color-legend-tap: #110e1f;     /* charcoal */
  --color-legend-hold: #ff811c;    /* orange — hold modifier */
  --color-legend-layer: #a63e6f;   /* pink — layer tap */
  --color-legend-command: #4b73b8; /* blue — &ok command */
  --color-key-held: #40b07e;       /* green — held/activator key */
  --color-key-stroke: #d0c8b8;     /* key border */
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

## Hosting on Vercel

Since this site is fully static (`@sveltejs/adapter-static`), deploying to Vercel requires no special configuration.

### Option A — Vercel CLI

```bash
pnpm build
npx vercel deploy --prebuilt build/
```

### Option B — Git integration (recommended)

1. Push your repo to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel will auto-detect SvelteKit. Override the build settings if needed:

   | Setting | Value |
   |---|---|
   | Framework Preset | SvelteKit |
   | Build Command | `pnpm build` |
   | Output Directory | `build` |
   | Install Command | `pnpm install` |

4. Click **Deploy**. Every push to the default branch redeploys automatically.

> **Note:** the `build/` directory is the static output — this is what Vercel serves. The `Output Directory` must be set to `build` (not the SvelteKit default of `.svelte-kit/output`).

## Tech stack

- [SvelteKit 2](https://kit.svelte.dev/) + Svelte 5 (runes), TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [`@sveltejs/adapter-static`](https://kit.svelte.dev/docs/adapter-static) — fully prerendered, no server required
- [`js-yaml`](https://github.com/nodeca/js-yaml) for YAML parsing
