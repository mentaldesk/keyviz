import type { KeyPosition } from '$lib/ergogen';
import type { ErgogenConfig } from '$lib/ergogen';

const ZMK_DISPLAY: Record<string, string> = {
  // Letters and numbers pass through as-is (A-Z, N0-N9 if needed)

  // Unshifted symbols
  MINUS: '-',   UNDER: '_',    UNDERSCORE: '_',
  EQUAL: '=',   PLUS: '+',
  LBKT: '[',    LEFT_BRACKET: '[',
  RBKT: ']',    RIGHT_BRACKET: ']',
  BSLH: '\\',   BACKSLASH: '\\',
  SEMI: ';',    SEMICOLON: ';',
  SQT: "'",     SINGLE_QUOTE: "'",
  DQT: '"',     DOUBLE_QUOTES: '"',
  GRAVE: '`',   GRAV: '`',
  COMMA: ',',   CMMA: ',',
  DOT: '.',
  SLASH: '/',   FSLH: '/',

  // Shifted symbols
  EXCL: '!',    EXCLAMATION: '!',
  AT: '@',      AT_SIGN: '@',
  HASH: '#',    POUND: '#',
  DLLR: '$',    DOLLAR: '$',
  PRCNT: '%',   PERCENT: '%',
  CARET: '^',   CRRT: '^',
  AMPS: '&',    AMPERSAND: '&',
  ASTRK: '*',   ASTERISK: '*',
  LPAR: '(',    LEFT_PARENTHESIS: '(',
  RPAR: ')',    RIGHT_PARENTHESIS: ')',
  LBRC: '{',    LEFT_BRACE: '{',
  RBRC: '}',    RIGHT_BRACE: '}',
  PIPE: '|',
  COLON: ':',   COLN: ':',
  TILDE: '~',   TILD: '~',
  LT: '<',      LESS_THAN: '<',
  GT: '>',      GREATER_THAN: '>',
  QMARK: '?',   QUESTION: '?',

  // Navigation / editing
  BSPC: '⌫',
  DEL: '⌦',
  RET: '↵',
  ESC: '⎋',
  TAB: '⇥',
  SPACE: 'SPC',
  UP: '↑',
  DOWN: '↓',
  LEFT: '←',
  RIGHT: '→',
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
