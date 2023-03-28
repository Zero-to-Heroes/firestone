import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';

export interface IPreferences {
	readonly locale: string;
	readonly collectionUseHighResImages: boolean;
	readonly overlayShowRarityColors: boolean;

	readonly bgsActiveRankFilter: 100 | 50 | 25 | 10 | 1;
	readonly bgsActiveTimeFilter: BgsActiveTimeFilterType;
	readonly bgsActiveTribesFilter: readonly Race[];
}
