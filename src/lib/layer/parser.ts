import type { Layer, Binding } from './types';
import { display } from './keymap';

export function parseLayer(text: string): Layer {
  const nameMatch = text.match(/display-name:\s*"([^"]+)"/);
  const name = nameMatch?.[1] ?? 'Unknown';

  const bindingsStart = text.indexOf('bindings:');
  const rawBindings = text.slice(bindingsStart + 'bindings:'.length);
  const tokens = rawBindings.trim().split(/\s+/).filter(Boolean);

  const bindings: Binding[] = [];
  let i = 0;
  while (i < tokens.length) {
    const type = tokens[i++];
    if (type === '&trans') {
      bindings.push({ tap: '', trans: true });
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
  return { name, bindings };
}
