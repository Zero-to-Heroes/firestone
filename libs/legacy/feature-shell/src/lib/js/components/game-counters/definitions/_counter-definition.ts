import { NonFunctionProperties } from '@firestone/shared/framework/common';

export interface CounterDefinition<U, T> {
	readonly type: CounterType;
	readonly value: number | string;
	readonly valueImg?: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter: boolean;

	select(state: U): T;
	emit(info: T): NonFunctionProperties<CounterDefinition<U, T>>;
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
	| 'lightray'
	| 'menagerie'
	| 'corpseSpent'
	| 'overdraft'
	| 'asvedon'
	| 'murozondTheInfinite'
	| 'nagaGiant'
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
	| 'bgsPogo'
	| 'bgsSouthsea'
	| 'bgsMagmaloc'
	| 'bgsMajordomo';
