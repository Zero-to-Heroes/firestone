import { MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsHeroFilterType, DuelsTimeFilterType } from '@firestone/duels/data-access';
import { DuelsMetaStats } from '@firestone/duels/view';
import { createAction, props } from '@ngrx/store';

export const initDuelsMetaHeroStats = createAction('[DUELS Meta Hero Stats Page] Init');
export const loadDuelsMetaHeroStatsSuccess = createAction(
	'[DUELS Meta Hero Stats/API] Load Success',
	props<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);
export const loadDuelsMetaHeroStatsFailure = createAction(
	'[DUELS Meta Hero Stats/API] Load Failure',
	props<{ error: any }>(),
);

export const initDuelsMetaHeroPowerStats = createAction('[DUELS Meta Hero Power Stats Page] Init');
export const loadDuelsMetaHeroPowerStatsSuccess = createAction(
	'[DUELS Meta Hero Power Stats/API] Load Success',
	props<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);
export const loadDuelsMetaHeroPowerStatsFailure = createAction(
	'[DUELS Meta Hero Power Stats/API] Load Failure',
	props<{ error: any }>(),
);

export const initDuelsMetaSignatureTreasureStats = createAction('[DUELS Meta Signature Treasure Stats Page] Init');
export const loadDuelsMetaSignatureTreasureStatsSuccess = createAction(
	'[DUELS Meta Signature Treasure Stats/API] Load Success',
	props<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);
export const loadDuelsMetaSignatureTreasureStatsFailure = createAction(
	'[DUELS Meta Signature Treasure Stats/API] Load Failure',
	props<{ error: any }>(),
);

export const initDuelsMetaActiveTreasureStats = createAction('[DUELS Meta Active Treasure Stats Page] Init');
export const loadDuelsMetaActiveTreasureStatsSuccess = createAction(
	'[DUELS Meta Active Treasure Stats/API] Load Success',
	props<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);
export const loadDuelsMetaActiveTreasureStatsFailure = createAction(
	'[DUELS Meta Active Treasure Stats/API] Load Failure',
	props<{ error: any }>(),
);

export const initDuelsMetaPassiveTreasureStats = createAction('[DUELS Meta Passive Treasure Stats Page] Init');
export const loadDuelsMetaPassiveTreasureStatsSuccess = createAction(
	'[DUELS Meta Passive Treasure Stats/API] Load Success',
	props<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate: Date | undefined;
		mmrPercentiles: readonly MmrPercentile[];
	}>(),
);
export const loadDuelsMetaPassiveTreasureStatsFailure = createAction(
	'[DUELS Meta Passive Treasure Stats/API] Load Failure',
	props<{ error: any }>(),
);

export const changeMetaHeroStatsPercentileFilter = createAction(
	'[DUELS Meta Hero Stats] Changed percentile filter',
	props<{
		currentPercentileSelection: MmrPercentile['percentile'];
	}>(),
);
export const changeMetaHeroStatsTimeFilter = createAction(
	'[DUELS Meta Hero Stats] Changed time filter',
	props<{
		currentTimePeriodSelection: DuelsTimeFilterType;
	}>(),
);
export const changeHeroFilter = createAction(
	'[DUELS Meta Hero Stats] Change hero filter',
	props<{
		currentHeroSelection: DuelsHeroFilterType;
	}>(),
);
export const changeHeroPowerFilter = createAction(
	'[DUELS Meta Hero Stats] Change hero power filter',
	props<{
		currentHeroPowerSelection: readonly string[];
	}>(),
);
export const changeSignatureTreasureFilter = createAction(
	'[DUELS Meta Hero Stats] Change signature filter',
	props<{
		currentSignatureSelection: readonly string[];
	}>(),
);

export const prefsUpdateSuccess = createAction('[DUELS Prefs Update] Success');

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
