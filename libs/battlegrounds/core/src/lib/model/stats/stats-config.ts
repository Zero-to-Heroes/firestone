import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { BgsRankFilterType } from '@firestone/shared/common/service';
import { arraysEqual } from '@firestone/shared/framework/common';

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
export const equalConfig = (a: Config | null | undefined, b: Config | null | undefined): boolean => {
	if (a === b) return true;
	if (!a || !b) return false;
	return (
		a.gameMode === b.gameMode &&
		a.rankFilter === b.rankFilter &&
		arraysEqual(a.tribesFilter, b.tribesFilter) &&
		arraysEqual(a.anomaliesFilter, b.anomaliesFilter) &&
		a.timeFilter === b.timeFilter &&
		a.options?.convervativeEstimate === b.options?.convervativeEstimate
	);
};
