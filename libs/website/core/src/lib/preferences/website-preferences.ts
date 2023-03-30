import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { IPreferences } from '@firestone/shared/framework/common';

export class WebsitePreferences implements IPreferences {
	readonly locale: string = 'enUS';
	readonly collectionUseHighResImages: boolean = true;
	readonly overlayShowRarityColors: boolean = true;

	readonly bgsActiveRankFilter: 100 | 50 | 25 | 10 | 1;
	readonly bgsActiveTimeFilter: BgsActiveTimeFilterType = 'last-patch';
	readonly bgsActiveTribesFilter: readonly Race[] = [];

	// website-exclusive
	readonly premium: PremiumInfo;
}

export interface PremiumInfo {
	lastUpdateDate: string;
	isPremium: boolean;
}
