export type HoldType = 'modifier' | 'layer';

export interface Binding {
  tap: string;           // display string for the tap action
  hold?: string;         // display string for the hold action (if any)
  holdType?: HoldType;   // 'modifier' for &ht, 'layer' for &lt
  trans?: boolean;       // &trans — passes through to the layer below
  command?: boolean;     // &ok — tap holds a '_'-separated description to render as legend
  bt?: boolean;          // &bt — tap holds channel number ('0','1','2') or 'CLR'
  os?: boolean;          // &os_sel — tap holds 'MAC', 'WIN', or 'LIN'
}

export interface Combo {
  name: string;
  description: string;
  keyPositions: number[];
  activatesLayer?: string;   // populated when bindings is &sl LAYER
}

export interface Layer {
  name: string;
  bindings: Binding[];
  combos: Combo[];
}
