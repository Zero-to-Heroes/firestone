import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsMetaStats } from '@firestone/duels/view';
import { createAction, props } from '@ngrx/store';

export const initDuelsMetaHeroStats = createAction('[DUELS Meta Hero Stats Page] Init');

export const loadDuelsMetaHeroStatsSuccess = createAction(
	'[DUELS Meta Hero Stats/API] Load DuelsCombinedHeroStat Success',
	props<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);

export const loadDuelsMetaHeroStatsFailure = createAction(
	'[DUELS Meta Hero Stats/API] Load DuelsCombinedHeroStat Failure',
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
