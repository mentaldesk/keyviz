export type ErgogenValue = number | string;

export interface ErgogenKeyProps {
	spread?: ErgogenValue;
	padding?: ErgogenValue;
	stagger?: ErgogenValue;
	splay?: ErgogenValue;
	origin?: [ErgogenValue, ErgogenValue];
	width?: ErgogenValue;
	height?: ErgogenValue;
}

export interface ErgogenAnchor {
	ref?: string;
	shift?: [ErgogenValue, ErgogenValue];
	rotate?: ErgogenValue;
}

export interface ErgogenZone {
	anchor?: ErgogenAnchor;
	columns?: Record<string, { key?: ErgogenKeyProps } | null>;
	rows?: Record<string, { key?: ErgogenKeyProps } | null>;
	key?: ErgogenKeyProps;
}

export interface ErgogenConfig {
	units?: Record<string, ErgogenValue>;
	points: {
		zones: Record<string, ErgogenZone>;
		key?: ErgogenKeyProps;
		mirror?: { ref: string; distance: ErgogenValue };
	};
}

export interface KeyPosition {
	name: string;
	x: number;
	y: number;
	r: number;
	w: number;
	h: number;
	zone: string;
	col: string;
	row: string;
	mirrored?: boolean;
}
