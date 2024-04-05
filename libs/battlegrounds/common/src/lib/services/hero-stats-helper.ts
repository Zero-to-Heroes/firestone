import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { PatchInfo } from '@firestone/shared/common/service';
import { GameStat } from '@firestone/stats/data-access';

export const filterBgsMatchStats = (
	bgsMatchStats: readonly GameStat[],
	timeFilter: BgsActiveTimeFilterType,
	mmrThreshold: number,
	currentBattlegroundsMetaPatch: PatchInfo | null,
): readonly GameStat[] => {
	return bgsMatchStats
		.filter((stat) => filterTime(stat, timeFilter, currentBattlegroundsMetaPatch))
		.filter((stat) => filterRank(stat, mmrThreshold));
};

const filterTime = (stat: GameStat, timeFilter: BgsActiveTimeFilterType, patch: PatchInfo | null) => {
	if (!timeFilter) {
		return true;
	}

	switch (timeFilter) {
		case 'last-patch':
			// The issue here is that sometimes the patch number in the client is not the official patch number
			// (for some reason, the client stil logs the logs patch number)
			// So using the patch number as a reference doesn't really work anymore
			// Since the patch itself usually goes live in the evening, maybe we can just use the day after
			// as the start for the patch period
			return (
				patch != null &&
				((stat.buildNumber ?? 0) >= patch.number ||
					stat.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000)
			);
		case 'past-three':
			return Date.now() - stat.creationTimestamp <= 3 * 24 * 60 * 60 * 1000;
		case 'past-seven':
			return Date.now() - stat.creationTimestamp <= 7 * 24 * 60 * 60 * 1000;
		case 'all-time':
		default:
			return true;
	}
};

const filterRank = (stat: GameStat, mmrThreshold: number) => {
	return stat.playerRank && parseInt(stat.playerRank) >= mmrThreshold;
};
