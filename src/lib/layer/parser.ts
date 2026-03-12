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

  const bindings: Binding[] = [];
  let i = 0;
  while (i < tokens.length) {
    const type = tokens[i++];
    if (type === '&trans') {
      bindings.push({ tap: '', trans: true });
    } else if (type === '&bt') {
      const param = tokens[i++];
      bindings.push({ tap: param === 'BT_CLR' ? 'CLR' : param, bt: true });
    } else if (type === '&os_sel') {
      bindings.push({ tap: tokens[i++], os: true });
    } else if (type === '&ok') {
      bindings.push({ tap: tokens[i++], command: true });
    } else if (type === '&kp') {
      bindings.push({ tap: display(tokens[i++]) });
    } else if (type === '&lt') {
      const hold = tokens[i++];
      const tap = tokens[i++];
      bindings.push({ tap: display(tap), hold, holdType: 'layer' });
    } else if (type === '&ht') {
      const hold = tokens[i++];
      const tap = tokens[i++];
      bindings.push({ tap: display(tap), hold, holdType: 'modifier' });
    }
  }

  const combos = combosStart !== -1 ? parseCombos(text.slice(combosStart + 1)) : [];

  return { name, bindings, combos };
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
      bindingTokens[0] === '&sl' && bindingTokens[1] ? bindingTokens[1] : undefined;
    combos.push({ name: currentName, description, keyPositions, activatesLayer });
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
