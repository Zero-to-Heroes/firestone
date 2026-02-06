import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BgsRankFilterType } from '@firestone/mainwindow/common';

export const getMmrThreshold = (rankFilter: BgsRankFilterType, mmrPercentiles: readonly MmrPercentile[]): number => {
	const percentile = mmrPercentiles?.find((p) => p.percentile === rankFilter);
	return percentile?.mmr ?? 0;
};
