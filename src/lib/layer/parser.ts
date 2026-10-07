import type { Layer, Binding, Combo } from './types';
import { display } from './keymap';

export function parseLayer(text: string): Layer {
  const nameMatch = text.match(/display-name:\s*"([^"]+)"/);
  const name = nameMatch?.[1] ?? 'Unknown';

  const bindingsStart = text.indexOf('bindings:');
  // Truncate bindings section at combos: so combo text isn't parsed as bindings
  const combosStart = text.indexOf('\ncombos:');
  const bindingsEnd = combosStart !== -1 ? combosStart : text.length;
  const rawBindings = text.slice(bindingsStart + 'bindings:'.length, bindingsEnd);
  const tokens = rawBindings.trim().split(/\s+/).filter(Boolean);

  const groups: string[][] = [];
  for (const token of tokens) {
    if (token.startsWith('&') || groups.length === 0) groups.push([token]);
    else groups[groups.length - 1].push(token);
  }
  const bindings = groups.map(([type, ...params]) => parseBinding(type, params));

  const combos = combosStart !== -1 ? parseCombos(text.slice(combosStart + 1)) : [];

  return { name, bindings, combos };
}

const OUTPUTS: Record<string, string> = { OUT_USB: 'USB', OUT_BLE: 'BLE', OUT_TOG: 'USB/BLE' };

// ZMK needs the suffix when a layer shares a keycode's name (e.g. SPACE).
const layerName = (macro: string) => macro.replace(/_LAYER$/, '');

function parseBinding(type: string, params: string[]): Binding {
  switch (type) {
    case '&trans':
      return { tap: '', trans: true };
    case '&none':
      return { tap: '' };
    case '&bt': {
      const [action, channel] = params;
      if (action === 'BT_SEL') return { tap: channel, bt: true };
      return { tap: action === 'BT_CLR' ? 'CLR' : action, bt: true };
    }
    case '&os_sel':
      return { tap: params[0], os: true };
    case '&ok':
      return { tap: params[0], command: true };
    case '&kp':
      return { tap: display(params[0]) };
    case '&lt':
      return { tap: display(params[1]), hold: layerName(params[0]), holdType: 'layer' };
    case '&mo':
      return { tap: '', hold: layerName(params[0]), holdType: 'layer' };
    case '&ht':
      return { tap: display(params[1]), hold: params[0], holdType: 'modifier' };
    case '&out':
      return { tap: OUTPUTS[params[0]] ?? params[0], command: true };
    case '&sys_reset':
      return { tap: 'Reset', command: true };
    case '&bootloader':
      return { tap: 'Boot_loader', command: true };
    default:
      return { tap: [type.slice(1), ...params].join('_'), command: true };
  }
}

function parseCombos(text: string): Combo[] {
  // text starts with 'combos:\n...'
  const lines = text.slice('combos:'.length).split('\n');
  const combos: Combo[] = [];

  let comboIndent: number | null = null;
  let propIndent: number | null = null;
  let currentName = '';
  let currentProps: Record<string, string> = {};

  const flush = () => {
    if (!currentName) return;
    const description = (currentProps['description'] ?? currentName).replace(/^"|"$/g, '').trim();
    const keyPositions = (currentProps['key-positions'] ?? '')
      .trim().split(/\s+/).filter(Boolean).map(Number);
    const bindingTokens = (currentProps['bindings'] ?? '').trim().split(/\s+/).filter(Boolean);
    const activatesLayer =
      bindingTokens[0] === '&sl' && bindingTokens[1] ? layerName(bindingTokens[1]) : undefined;
    const oneshotMod = bindingTokens[0] === '&skq' ? true : undefined;
    combos.push({ name: currentName, description, keyPositions, activatesLayer, oneshotMod });
  };

  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = (line.match(/^(\s*)/)?.[1] ?? '').length;
    const content = line.trim();

    if (comboIndent === null && indent > 0) comboIndent = indent;

    if (indent === comboIndent && content.endsWith(':')) {
      flush();
      currentName = content.slice(0, -1);
      currentProps = {};
      propIndent = null;
    } else if (comboIndent !== null && indent > comboIndent && currentName) {
      if (propIndent === null) propIndent = indent;
      if (indent === propIndent) {
        const colonIdx = content.indexOf(':');
        if (colonIdx > 0) {
          currentProps[content.slice(0, colonIdx).trim()] = content.slice(colonIdx + 1).trim();
        }
      }
    }
  }
  flush();

  return combos;
}
