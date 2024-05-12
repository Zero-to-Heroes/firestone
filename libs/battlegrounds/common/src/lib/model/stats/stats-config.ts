import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType } from '@firestone/shared/common/service';

export interface Config {
	gameMode: 'battlegrounds' | 'battlegrounds-duo';
	rankFilter: BgsRankFilterType;
	tribesFilter: readonly Race[];
	anomaliesFilter: readonly string[];
	timeFilter: BgsActiveTimeFilterType;
	options?: {
		convervativeEstimate?: boolean;
	};
}
