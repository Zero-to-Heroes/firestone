import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';

export interface MetaHeroStatsState {
	loaded: boolean;
	error?: string | null;

	stats?: readonly BgsMetaHeroStatTierItem[];
	lastUpdateDate?: Date;
	mmrPercentiles?: readonly MmrPercentile[];

	// TODO: move this to a "preferences" object that can be persisted in the localStorage
	currentPercentileSelection: MmrPercentile['percentile'];
	currentTimePeriodSelection: BgsActiveTimeFilterType;
	currentTribesSelection: readonly Race[];
}
