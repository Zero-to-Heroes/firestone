import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsCombinedHeroStat } from '@firestone/duels/data-access';
import { createAction, props } from '@ngrx/store';

export const initDuelsMetaHeroStats = createAction('[DUELS Meta Hero Stats Page] Init');

export const loadDuelsMetaHeroStatsSuccess = createAction(
	'[DUELS Meta Hero Stats/API] Load DuelsMetaHeroStatTierItem Success',
	props<{
		stats: readonly DuelsCombinedHeroStat[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);

export const loadDuelsMetaHeroStatsFailure = createAction(
	'[DUELS Meta Hero Stats/API] Load DuelsMetaHeroStatTierItem Failure',
	props<{ error: any }>(),
);

// export const changeMetaHeroStatsTimeFilter = createAction(
// 	'[DUELS Meta Hero Stats] Changed time filter',
// 	props<{
// 		currentTimePeriodSelection: DuelsActiveTimeFilterType;
// 	}>(),
// );

// export const changeMetaHeroStatsPercentileFilter = createAction(
// 	'[DUELS Meta Hero Stats] Changed percentile filter',
// 	props<{
// 		currentPercentileSelection: MmrPercentile['percentile'];
// 	}>(),
// );

// export const changeMetaHeroStatsTribesFilter = createAction(
// 	'[DUELS Meta Hero Stats] Changed percentile filter',
// 	props<{
// 		currentTribesSelection: readonly Race[];
// 	}>(),
// );
