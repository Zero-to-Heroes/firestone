export interface CounterDefinition {
	readonly type: CounterType;
	readonly value: number | string;
	readonly valueImg?: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter: boolean;
}

// Use camelCase because it uses conventions to get the pref property names
export type CounterType =
	| 'galakrond'
	| 'pogo'
	| 'attack'
	| 'jadeGolem'
	| 'cthun'
	| 'fatigue'
	| 'abyssalCurse'
	| 'spells'
	| 'elemental'
	| 'watchpost'
	| 'libram'
	| 'bolner'
	| 'brilliantMacaw'
	| 'vanessaVanCleef'
	| 'murozondTheInfinite'
	| 'ladyDarkvein'
	| 'greySageParrot'
	| 'heroPowerDamage'
	| 'multicaster'
	| 'si7Counter'
	| 'elwynnBoar'
	| 'volatileSkeleton'
	| 'coralKeeper'
	| 'bgsPogo'
	| 'bgsSouthsea'
	| 'bgsMajordomo';
