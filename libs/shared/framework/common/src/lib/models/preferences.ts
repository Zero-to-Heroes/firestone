import { Race } from '@firestone-hs/reference-data';

export interface IPreferences {
	readonly locale: string;
	readonly collectionUseHighResImages: boolean;
	readonly overlayShowRarityColors: boolean;

	readonly bgsActiveRankFilter: 100 | 50 | 25 | 10 | 1;
	readonly bgsActiveTimeFilter: 'all-time' | 'past-three' | 'past-seven' | 'last-patch';
	readonly bgsActiveTribesFilter: readonly Race[];

	readonly duelsActiveMmrFilter: 100 | 50 | 25 | 10 | 1;
}
