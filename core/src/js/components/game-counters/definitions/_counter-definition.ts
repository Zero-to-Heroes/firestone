export interface CounterDefinition {
	readonly type: CounterType;
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter: boolean;
}

export type CounterType = 'galakrond' | 'pogo' | 'bgsPogo' | 'attack' | 'jadeGolem' | 'cthun' | 'fatigue' | 'spells';
