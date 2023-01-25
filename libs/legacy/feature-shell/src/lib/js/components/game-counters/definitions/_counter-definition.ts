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
	| 'monstrousParrot'
	| 'vanessaVanCleef'
	| 'asvedon'
	| 'murozondTheInfinite'
	| 'anachronos'
	| 'bonelordFrostwhisper'
	| 'parrotMascot'
	| 'queensguard'
	| 'spectralPillager'
	| 'ladyDarkvein'
	| 'greySageParrot'
	| 'heroPowerDamage'
	| 'shockspitter'
	| 'multicaster'
	| 'si7Counter'
	| 'elwynnBoar'
	| 'volatileSkeleton'
	| 'relic'
	| 'coralKeeper'
	| 'bgsPogo'
	| 'bgsSouthsea'
	| 'bgsMagmaloc'
	| 'bgsMajordomo';
