export type HoldType = 'modifier' | 'layer';

export interface Binding {
  tap: string;           // display string for the tap action
  hold?: string;         // display string for the hold action (if any)
  holdType?: HoldType;   // 'modifier' for &ht, 'layer' for &lt
  trans?: boolean;       // &trans — passes through to the layer below
}

export interface Layer {
  name: string;
  bindings: Binding[];
}
