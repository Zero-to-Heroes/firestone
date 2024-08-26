import { Race, ReferenceCard } from '@firestone-hs/reference-data';

export interface ExtendedReferenceCard extends ReferenceCard {
	readonly banned?: boolean;
	readonly trinketLocked?: boolean;
	readonly trinketLockedReason?: readonly string[];
}

export interface Tier {
	readonly type: TierViewType;
	readonly tavernTier: TavernTierType;
	readonly tavernTierIcon: string;
	readonly tooltip: string;
	readonly groups: readonly TierGroup[];
}

export interface TierGroup {
	readonly label: string;
	readonly tribe: Race;
	readonly cards: readonly ExtendedReferenceCard[];
}

export type TavernTierType =
	| number
	| 'B'
	| 'D'
	| 'DS'
	| 'T'
	| 'E'
	| 'R'
	| 'S'
	| 'Buds'
	| 'spells'
	| 'trinkets'
	| string;
export type TierViewType = 'standard' | 'mechanics' | 'tribe';
