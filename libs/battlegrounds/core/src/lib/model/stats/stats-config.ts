import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType } from '@firestone/shared/common/service';

export interface Config {
	readonly gameMode: 'battlegrounds' | 'battlegrounds-duo';
	readonly rankFilter: BgsRankFilterType;
	readonly tribesFilter: readonly Race[];
	readonly anomaliesFilter: readonly string[];
	readonly timeFilter: BgsActiveTimeFilterType;
	readonly options?: {
		readonly convervativeEstimate?: boolean;
	};
}
