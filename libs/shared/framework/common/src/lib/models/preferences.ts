export interface IPreferences {
	readonly locale: string;
	readonly collectionUseHighResImages: boolean;
	readonly overlayShowRarityColors: boolean;

	readonly bgsActiveRankFilter: 100 | 50 | 25 | 10 | 1;
}
