import { allDuelsHeroes } from '@firestone-hs/reference-data';

export type DuelsHeroFilterType = typeof allDuelsHeroes[number][];
export type DuelsTimeFilterType = 'all-time' | 'past-three' | 'past-seven' | 'last-patch';
export type DuelsGameModeFilterType = 'all' | 'duels' | 'paid-duels';
export type DuelsStatTypeFilterType = 'hero' | 'hero-power' | 'signature-treasure';
export type DuelsTreasureStatTypeFilterType =
	| 'treasure-1'
	| 'treasure-2'
	| 'treasure-3'
	| 'passive-1'
	| 'passive-2'
	| 'passive-3';

export interface DuelsCombinedHeroStat {
	readonly periodStart: string | null;
	readonly cardId: string;
	readonly hero: string;
	readonly heroPower: string;
	readonly signatureTreasure: string;
	readonly globalTotalMatches: number;
	readonly globalPopularity: number;
	readonly globalWinrate: number;
	readonly globalWinDistribution: readonly { winNumber: number; value: number }[];
}
