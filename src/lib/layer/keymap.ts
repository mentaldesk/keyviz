import type { KeyPosition } from '$lib/ergogen';
import type { ErgogenConfig } from '$lib/ergogen';

const ZMK_DISPLAY: Record<string, string> = {
  SQT: "'",
  COMMA: ',',
  DOT: '.',
  SLASH: '/',
  SEMI: ';',
  MINUS: '-',
  EQUAL: '=',
  LBKT: '[',
  RBKT: ']',
  BSLH: '\\',
  GRAVE: '`',
  BSPC: '⌫',
  DEL: '⌦',
  SPACE: 'SPC',
  RET: '↵',
  ESC: '⎋',
  TAB: '⇥',
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→'
};

export function display(zmk: string): string {
  return ZMK_DISPLAY[zmk] ?? zmk;
}

export function getBindingOrder(
  keys: KeyPosition[],
  config: ErgogenConfig
): KeyPosition[] {
  const result: KeyPosition[] = [];
  for (const [zoneName, zone] of Object.entries(config.points.zones)) {
    const colOrder = Object.keys(zone?.columns ?? {});
    const rowOrder = Object.keys(zone?.rows ?? {});
    for (const rowName of [...rowOrder].reverse()) {     // visual top→bottom
      // left half: columns in YAML order
      for (const colName of colOrder) {
        const k = keys.find(
          (k) => k.zone === zoneName && k.col === colName && k.row === rowName && !k.mirrored
        );
        if (k) result.push(k);
      }
      // right half: mirrored columns in reversed YAML order (visual left→right)
      for (const colName of [...colOrder].reverse()) {
        const k = keys.find(
          (k) => k.zone === zoneName && k.col === colName && k.row === rowName && k.mirrored
        );
        if (k) result.push(k);
      }
    }
  }
  return result;
}
