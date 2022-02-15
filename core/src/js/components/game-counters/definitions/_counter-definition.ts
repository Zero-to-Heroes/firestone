export interface CounterDefinition {
	readonly type: CounterType;
	readonly value: number | string;
	readonly valueImg?: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter: boolean;
}

// Use camelCase because it uses conventions to get the pref property names
export type CounterType =
	| 'galakrond'
	| 'pogo'
	| 'bgsPogo'
	| 'attack'
	| 'jadeGolem'
	| 'cthun'
	| 'fatigue'
	| 'spells'
	| 'elemental'
	| 'watchpost'
	| 'libram'
	| 'bolner'
	| 'brilliantMacaw'
	| 'heroPowerDamage'
	| 'multicaster'
	| 'si7Counter'
	| 'elwynnBoar';
