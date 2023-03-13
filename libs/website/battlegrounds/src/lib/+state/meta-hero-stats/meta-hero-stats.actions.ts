import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { createAction, props } from '@ngrx/store';

export const initBgsMetaHeroStats = createAction('[BGS Meta Hero Stats Page] Init');

export const loadBgsMetaHeroStatsSuccess = createAction(
	'[BGS Meta Hero Stats/API] Load BgsMetaHeroStatTierItem Success',
	props<{
		stats: readonly BgsMetaHeroStatTierItem[];
		lastUpdateDate: Date;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);

export const loadBgsMetaHeroStatsFailure = createAction(
	'[BGS Meta Hero Stats/API] Load BgsMetaHeroStatTierItem Failure',
	props<{ error: any }>(),
);

export const changeMetaHeroStatsTimeFilter = createAction(
	'[BGS Meta Hero Stats] Changed time filter',
	props<{
		currentTimePeriodSelection: BgsActiveTimeFilterType;
	}>(),
);

export const changeMetaHeroStatsPercentileFilter = createAction(
	'[BGS Meta Hero Stats] Changed percentile filter',
	props<{
		currentPercentileSelection: MmrPercentile['percentile'];
	}>(),
);

export const changeMetaHeroStatsTribesFilter = createAction(
	'[BGS Meta Hero Stats] Changed percentile filter',
	props<{
		currentTribesSelection: readonly Race[];
	}>(),
);
